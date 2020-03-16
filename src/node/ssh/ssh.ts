/**
 * Provides utilities for handling SSH connections
 */
import * as net from "net"
import * as cp from "child_process"
import * as ssh from "ssh2"
import * as nodePty from "node-pty"
import { fillSftpStream } from "./sftp"

/**
 * Fills out all of the functionality of SSH using node equivalents.
 */
export function fillSshSession(accept: () => ssh.Session): void {
  let pty: nodePty.IPty | undefined
  let activeProcess: cp.ChildProcess
  let ptyInfo: ssh.PseudoTtyInfo | undefined
  const env: { [key: string]: string } = {}

  const session = accept()

  // Run a command, stream back the data
  const cmd = (command: string, channel: ssh.ServerChannel): void => {
    if (ptyInfo) {
      // Remove undefined and project env vars
      // keysToRemove taken from sanitizeProcessEnvironment
      const keysToRemove = [/^ELECTRON_.+$/, /^GOOGLE_API_KEY$/, /^VSCODE_.+$/, /^SNAP(|_.*)$/]
      const env = Object.keys(process.env).reduce((prev, k) => {
        if (process.env[k] === undefined) {
          return prev
        }
        const val = process.env[k] as string
        if (keysToRemove.find((rx) => val.search(rx))) {
          return prev
        }
        prev[k] = val
        return prev
      }, {} as { [key: string]: string })

      pty = nodePty.spawn(command, [], {
        cols: ptyInfo.cols,
        rows: ptyInfo.rows,
        env,
      })
      pty.onData((d) => channel.write(d))
      pty.on("exit", (exitCode) => {
        channel.exit(exitCode)
        channel.close()
      })
      channel.on("data", (d: string) => pty && pty.write(d))
      return
    }

    const proc = cp.spawn(command, { shell: true })
    proc.stdout.on("data", (d) => channel.stdout.write(d))
    proc.stderr.on("data", (d) => channel.stderr.write(d))
    proc.on("exit", (exitCode) => {
      channel.exit(exitCode || 0)
      channel.close()
    })
    channel.stdin.on("data", (d: unknown) => proc.stdin.write(d))
    channel.stdin.on("close", () => proc.stdin.end())
  }

  session.on("pty", (accept, _, info) => {
    ptyInfo = info
    accept && accept()
  })

  session.on("shell", (accept) => {
    cmd(process.env.SHELL || "/usr/bin/env bash", accept())
  })

  session.on("exec", (accept, _, info) => {
    cmd(info.command, accept())
  })

  session.on("sftp", fillSftpStream)

  session.on("signal", (accept, _, info) => {
    accept && accept()
    process.kill((pty || activeProcess).pid, info.name)
  })

  session.on("env", (accept, _reject, info) => {
    accept && accept()
    env[info.key] = info.value
  })

  session.on("auth-agent", (accept) => {
    accept()
  })

  session.on("window-change", (accept, reject, info) => {
    if (pty) {
      pty.resize(info.cols, info.rows)
      accept && accept()
    } else {
      reject()
    }
  })
}

/**
 * Pipes a requested port over SSH
 */
export function forwardSshPort(
  accept: () => ssh.ServerChannel,
  reject: () => boolean,
  info: ssh.TcpipRequestInfo,
): void {
  const fwdSocket = net.createConnection(info.destPort, info.destIP)
  fwdSocket.on("error", () => reject())
  fwdSocket.on("connect", () => {
    const channel = accept()
    channel.pipe(fwdSocket)
    channel.on("close", () => fwdSocket.end())
    fwdSocket.pipe(channel)
    fwdSocket.on("close", () => channel.close())
    fwdSocket.on("error", () => channel.end())
    fwdSocket.on("end", () => channel.end())
  })
}
