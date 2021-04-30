import { Page } from "playwright"
import { CODE_SERVER_ADDRESS } from "../../utils/constants"
// This is a Page Object Model
// We use these to simplify e2e test authoring
// See Playwright docs: https://playwright.dev/docs/pom/
export class CodeServer {
  page: Page
  editorSelector = "div.monaco-workbench"

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigates to CODE_SERVER_ADDRESS
   */
  async navigate() {
    await this.page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
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
      if ((await this.isEditorVisible()) && (await this.isConnected)) {
        console.log(`    Editor became ready after ${reloadCount} reloads`)
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
    // If it's not visible after 5 seconds, something is wrong
    await this.page.waitForLoadState("networkidle")
    return await this.page.isVisible(this.editorSelector)
  }

  /**
   * Checks if the editor is visible
   */
  async isConnected() {
    await this.page.waitForLoadState("networkidle")

    const host = new URL(CODE_SERVER_ADDRESS).host
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
   * Navigates to CODE_SERVER_ADDRESS
   * and reloads until the editor is ready
   *
   * Helpful for running before tests
   */
  async setup() {
    await this.navigate()
    await this.reloadUntilEditorIsReady()
  }
}
