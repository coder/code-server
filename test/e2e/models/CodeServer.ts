import { field, Logger, logger } from "@coder/logger"
import * as cp from "child_process"
import { promises as fs } from "fs"
import * as path from "path"
import { Page } from "playwright"
import { logError } from "../../../src/common/util"
import { onLine } from "../../../src/node/util"
import { PASSWORD, workspaceDir } from "../../utils/constants"
import { idleTimer, tmpdir } from "../../utils/helpers"

interface CodeServerProcess {
  process: cp.ChildProcess
  address: string
}

class CancelToken {
  private _canceled = false
  public canceled(): boolean {
    return this._canceled
  }
  public cancel(): void {
    this._canceled = true
  }
}

/**
 * Class for spawning and managing code-server.
 */
export class CodeServer {
  private process: Promise<CodeServerProcess> | undefined
  public readonly logger: Logger
  private closed = false

  constructor(name: string, private readonly codeServerArgs: string[]) {
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
    await fs.mkdir(path.join(dir, "User"))
    await fs.writeFile(
      path.join(dir, "User/settings.json"),
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
          ...this.codeServerArgs,
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
          "--extensions-dir",
          path.join(__dirname, "../extensions"),
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

      const timer = idleTimer("Failed to extract address; did the format change?", reject)

      proc.on("error", (error) => {
        this.logger.error(error.message)
        timer.dispose()
        reject(error)
      })

      proc.on("close", (code) => {
        const error = new Error("closed unexpectedly")
        if (!this.closed) {
          this.logger.error(error.message, field("code", code))
        }
        timer.dispose()
        reject(error)
      })

      let resolved = false
      proc.stdout.setEncoding("utf8")
      onLine(proc, (line) => {
        // As long as we are actively getting input reset the timer.  If we stop
        // getting input and still have not found the address the timer will
        // reject.
        timer.reset()

        // Log the line without the timestamp.
        this.logger.trace(line.replace(/\[.+\]/, ""))
        if (resolved) {
          return
        }
        const match = line.trim().match(/HTTPS? server listening on (https?:\/\/[.:\d]+)\/?$/)
        if (match) {
          // Cookies don't seem to work on IP address so swap to localhost.
          // TODO: Investigate whether this is a bug with code-server.
          const address = match[1].replace("127.0.0.1", "localhost")
          this.logger.debug(`spawned on ${address}`)
          resolved = true
          timer.dispose()
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

  constructor(private readonly codeServer: CodeServer, public readonly page: Page) {
    this.page.on("console", (message) => {
      this.codeServer.logger.debug(message)
    })
    this.page.on("pageerror", (error) => {
      logError(this.codeServer.logger, "page", error)
    })
  }

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
    this.codeServer.logger.debug("Waiting for editor to be ready...")

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
        this.codeServer.logger.debug(`editor became ready after ${reloadCount} reloads`)
        break
      }
      await this.page.reload()
    }

    this.codeServer.logger.debug("Editor is ready!")
  }

  /**
   * Checks if the editor is visible
   */
  async isEditorVisible() {
    this.codeServer.logger.debug("Waiting for editor to be visible...")
    // Make sure the editor actually loaded
    await this.page.waitForSelector(this.editorSelector)
    const visible = await this.page.isVisible(this.editorSelector)

    this.codeServer.logger.debug(`Editor is ${visible ? "not visible" : "visible"}!`)

    return visible
  }

  /**
   * Checks if the editor is visible
   */
  async isConnected() {
    this.codeServer.logger.debug("Waiting for network idle...")

    await this.page.waitForLoadState("networkidle")

    const host = new URL(await this.codeServer.address()).host
    // NOTE: This seems to be pretty brittle between version changes.
    const hostSelector = `[aria-label="remote  ${host}"]`
    this.codeServer.logger.debug(`Waiting selector: ${hostSelector}`)
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
    await this.executeCommandViaMenus("Terminal: Focus Terminal")

    // Wait for terminal textarea to show up
    await this.page.waitForSelector("textarea.xterm-helper-textarea")
  }

  /**
   * Navigate to the command palette via menus then execute a command by typing
   * it then clicking the match from the results.
   */
  async executeCommandViaMenus(command: string) {
    await this.navigateMenus(["View", "Command Palette"])

    await this.page.keyboard.type(command)

    await this.page.hover(`text=${command}`)
    await this.page.click(`text=${command}`)
  }

  /**
   * Navigate through the specified set of menus. If it fails it will keep
   * trying.
   */
  async navigateMenus(menus: string[]) {
    const navigate = async (cancelToken: CancelToken) => {
      const steps: Array<() => Promise<unknown>> = [() => this.page.waitForSelector(`${menuSelector}:focus-within`)]
      for (const menu of menus) {
        // Normally these will wait for the item to be visible and then execute
        // the action. The problem is that if the menu closes these will still
        // be waiting and continue to execute once the menu is visible again,
        // potentially conflicting with the new set of navigations (for example
        // if the old promise clicks logout before the new one can). By
        // splitting them into two steps each we can cancel before running the
        // action.
        steps.push(() => this.page.hover(`text=${menu}`, { trial: true }))
        steps.push(() => this.page.hover(`text=${menu}`, { force: true }))
        steps.push(() => this.page.click(`text=${menu}`, { trial: true }))
        steps.push(() => this.page.click(`text=${menu}`, { force: true }))
      }
      for (const step of steps) {
        await step()
        if (cancelToken.canceled()) {
          this.codeServer.logger.debug("menu navigation canceled")
          return false
        }
      }
      return true
    }

    const menuSelector = '[aria-label="Application Menu"]'
    const open = async () => {
      await this.page.click(menuSelector)
      await this.page.waitForSelector(`${menuSelector}:not(:focus-within)`)
      return false
    }

    // TODO: Starting in 1.57 something closes the menu after opening it if we
    // open it too soon. To counter that we'll watch for when the menu loses
    // focus and when/if it does we'll try again.
    // I tried using the classic menu but it doesn't show up at all for some
    // reason. I also tried toggle but the menu disappears after toggling.
    let retryCount = 0
    let cancelToken = new CancelToken()
    while (!(await Promise.race([open(), navigate(cancelToken)]))) {
      this.codeServer.logger.debug("menu was closed, retrying")
      ++retryCount
      cancelToken.cancel()
      cancelToken = new CancelToken()
    }

    this.codeServer.logger.debug(`menu navigation retries: ${retryCount}`)
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
