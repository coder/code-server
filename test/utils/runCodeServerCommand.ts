import { exec } from "child_process"
import { promisify } from "util"

/**
 *
 * A helper function for integration tests to run code-server commands.
 */
export async function runCodeServerCommand(argv: string[]): Promise<{ stdout: string; stderr: string }> {
  const CODE_SERVER_COMMAND = process.env.CODE_SERVER_PATH || "/var/tmp/coder/code-server/bin/code-server"
  const { stdout, stderr } = await promisify(exec)(`${CODE_SERVER_COMMAND} ${argv.join(" ")}`)

  return { stdout, stderr }
}
