import { Logger, logger } from "@coder/logger"
import * as cp from "child_process"
import { promises as fs } from "fs"
import * as path from "path"
import { Page } from "playwright"
import { onLine } from "../../../src/node/util"
import { PASSWORD, workspaceDir } from "../../utils/constants"
import { tmpdir } from "../../utils/helpers"

interface CodeServerProcess {
  process: cp.ChildProcess
  address: string
}

/**
 * Class for spawning and managing code-server.
 */
export class CodeServer {
  private process: Promise<CodeServerProcess> | undefined
  private readonly logger: Logger
  private closed = false

  constructor(name: string) {
    this.logger = logger.named(name)
  }

  /**
   * The address at which code-server can be accessed. Spawns code-server if it
   * has not yet been spawned.
   */
  async address(): Promise<string> {
    if (!this.process) {
      this.process = this.spawn()
    }
    const { address } = await this.process
    return address
  }

  /**
   * Create a random workspace and seed it with settings.
   */
  private async createWorkspace(): Promise<string> {
    const dir = await tmpdir(workspaceDir)
    await fs.mkdir(path.join(dir, ".vscode"))
    await fs.writeFile(
      path.join(dir, ".vscode/settings.json"),
      JSON.stringify({
        "workbench.startupEditor": "none",
      }),
      "utf8",
    )
    return dir
  }

  /**
   * Spawn a new code-server process with its own workspace and data
   * directories.
   */
  private async spawn(): Promise<CodeServerProcess> {
    // This will be used both as the workspace and data directory to ensure
    // instances don't bleed into each other.
    const dir = await this.createWorkspace()

    return new Promise((resolve, reject) => {
      this.logger.debug("spawning")
      const proc = cp.spawn(
        "node",
        [
          process.env.CODE_SERVER_TEST_ENTRY || ".",
          // Using port zero will spawn on a random port.
          "--bind-addr",
          "127.0.0.1:0",
          // Setting the XDG variables would be easier and more thorough but the
          // modules we import ignores those variables for non-Linux operating
          // systems so use these flags instead.
          "--config",
          path.join(dir, "config.yaml"),
          "--user-data-dir",
          dir,
          // The last argument is the workspace to open.
          dir,
        ],
        {
          cwd: path.join(__dirname, "../../.."),
          env: {
            ...process.env,
            PASSWORD,
          },
        },
      )

      proc.on("error", (error) => {
        this.logger.error(error.message)
        reject(error)
      })

      proc.on("close", () => {
        const error = new Error("closed unexpectedly")
        if (!this.closed) {
          this.logger.error(error.message)
        }
        reject(error)
      })

      let resolved = false
      proc.stdout.setEncoding("utf8")
      onLine(proc, (line) => {
        // Log the line without the timestamp.
        this.logger.trace(line.replace(/\[.+\]/, ""))
        if (resolved) {
          return
        }
        const match = line.trim().match(/HTTP server listening on (https?:\/\/[.:\d]+)$/)
        if (match) {
          // Cookies don't seem to work on IP address so swap to localhost.
          // TODO: Investigate whether this is a bug with code-server.
          const address = match[1].replace("127.0.0.1", "localhost")
          this.logger.debug(`spawned on ${address}`)
          resolved = true
          resolve({ process: proc, address })
        }
      })
    })
  }

  /**
   * Close the code-server process.
   */
  async close(): Promise<void> {
    logger.debug("closing")
    if (this.process) {
      const proc = (await this.process).process
      this.closed = true // To prevent the close handler from erroring.
      proc.kill()
    }
  }
}

/**
 * This is a "Page Object Model" (https://playwright.dev/docs/pom/) meant to
 * wrap over a page and represent actions on that page in a more readable way.
 * This targets a specific code-server instance which must be passed in.
 * Navigation and setup performed by this model will cause the code-server
 * process to spawn if it hasn't yet.
 */
export class CodeServerPage {
  private readonly editorSelector = "div.monaco-workbench"

  constructor(private readonly codeServer: CodeServer, public readonly page: Page) {}

  address() {
    return this.codeServer.address()
  }

  /**
   * Navigate to code-server.
   */
  async navigate() {
    const address = await this.codeServer.address()
    await this.page.goto(address, { waitUntil: "networkidle" })
  }

  /**
   * Checks if the editor is visible
   * and that we are connected to the host
   *
   * Reload until both checks pass
   */
  async reloadUntilEditorIsReady() {
    const editorIsVisible = await this.isEditorVisible()
    const editorIsConnected = await this.isConnected()
    let reloadCount = 0

    // Occassionally code-server timeouts in Firefox
    // we're not sure why
    // but usually a reload or two fixes it
    // TODO@jsjoeio @oxy look into Firefox reconnection/timeout issues
    while (!editorIsVisible && !editorIsConnected) {
      // When a reload happens, we want to wait for all resources to be
      // loaded completely. Hence why we use that instead of DOMContentLoaded
      // Read more: https://thisthat.dev/dom-content-loaded-vs-load/
      await this.page.waitForLoadState("load")
      // Give it an extra second just in case it's feeling extra slow
      await this.page.waitForTimeout(1000)
      reloadCount += 1
      if ((await this.isEditorVisible()) && (await this.isConnected())) {
        logger.debug(`editor became ready after ${reloadCount} reloads`)
        break
      }
      await this.page.reload()
    }
  }

  /**
   * Checks if the editor is visible
   */
  async isEditorVisible() {
    // Make sure the editor actually loaded
    await this.page.waitForSelector(this.editorSelector)
    return await this.page.isVisible(this.editorSelector)
  }

  /**
   * Checks if the editor is visible
   */
  async isConnected() {
    await this.page.waitForLoadState("networkidle")

    const host = new URL(await this.codeServer.address()).host
    const hostSelector = `[title="Editing on ${host}"]`
    await this.page.waitForSelector(hostSelector)

    return await this.page.isVisible(hostSelector)
  }

  /**
   * Focuses Integrated Terminal
   * by using "Terminal: Focus Terminal"
   * from the Command Palette
   *
   * This should focus the terminal no matter
   * if it already has focus and/or is or isn't
   * visible already.
   */
  async focusTerminal() {
    // Click [aria-label="Application Menu"] div[role="none"]
    await this.page.click('[aria-label="Application Menu"] div[role="none"]')

    // Click text=View
    await this.page.hover("text=View")
    await this.page.click("text=View")

    // Click text=Command Palette
    await this.page.hover("text=Command Palette")
    await this.page.click("text=Command Palette")

    // Type Terminal: Focus Terminal
    await this.page.keyboard.type("Terminal: Focus Terminal")

    // Click Terminal: Focus Terminal
    await this.page.hover("text=Terminal: Focus Terminal")
    await this.page.click("text=Terminal: Focus Terminal")

    // Wait for terminal textarea to show up
    await this.page.waitForSelector("textarea.xterm-helper-textarea")
  }

  /**
   * Navigates to code-server then reloads until the editor is ready.
   *
   * It is recommended to run setup before using this model in any tests.
   */
  async setup(authenticated: boolean) {
    await this.navigate()
    // If we aren't authenticated we'll see a login page so we can't wait until
    // the editor is ready.
    if (authenticated) {
      await this.reloadUntilEditorIsReady()
    }
  }
}
