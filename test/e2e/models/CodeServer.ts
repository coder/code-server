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
   * and reloads until it is
   */
  async reloadUntilEditorIsVisible() {
    const editorIsVisible = await this.isEditorVisible()
    let reloadCount = 0

    // Occassionally code-server timeouts in Firefox
    // we're not sure why
    // but usually a reload or two fixes it
    // TODO@jsjoeio @oxy look into Firefox reconnection/timeout issues
    while (!editorIsVisible) {
      // When a reload happens, we want to wait for all resources to be
      // loaded completely. Hence why we use that instead of DOMContentLoaded
      // Read more: https://thisthat.dev/dom-content-loaded-vs-load/
      await this.page.waitForLoadState("load")
      // Give it an extra second just in case it's feeling extra slow
      await this.page.waitForTimeout(1000)
      reloadCount += 1
      if (await this.isEditorVisible()) {
        console.log(`    Editor became visible after ${reloadCount} reloads`)
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

    // See [aria-label="Remote Host"]
    const hostElement = await this.page.$(`[aria-label="Remote Host"]`)
    // Returns something like " localhost:8080"
    const host = await hostElement?.innerText()

    // Check if host (localhost:8080) is in the CODE_SERVER_ADDRESS
    // if it is, we're connected!
    // if not, we may need to reload the page
    // Make sure to trim whitespace too
    const isEditorConnected = host ? CODE_SERVER_ADDRESS.includes(host.trim()) : false
    return isEditorConnected
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
   * and reloads until the editor is visible
   *
   * Helpful for running before tests
   */
  async setup() {
    await this.navigate()
    await this.reloadUntilEditorIsVisible()
  }
}
