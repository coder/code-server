import { Page } from "playwright"
import { CODE_SERVER_ADDRESS } from "../../utils/constants"
// This is a Page Object Model
// We use these to simplify e2e test authoring
// See Playwright docs: https://playwright.dev/docs/pom/
export class CodeServer {
  page: Page

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
      reloadCount += 1
      if (await this.isEditorVisible()) {
        console.log(`    Editor became visible after ${reloadCount} reloads`)
        break
      }
      // When a reload happens, we want to wait for all resources to be
      // loaded completely. Hence why we use that instead of DOMContentLoaded
      // Read more: https://thisthat.dev/dom-content-loaded-vs-load/
      await this.page.reload({ waitUntil: "load" })
    }
  }

  /**
   * Checks if the editor is visible
   */
  async isEditorVisible() {
    // Make sure the editor actually loaded
    // If it's not visible after 2 seconds, something is wrong
    await this.page.waitForLoadState("networkidle")
    return await this.page.isVisible("div.monaco-workbench", { timeout: 5000 })
  }

  /**
   * Focuses Integrated Terminal
   * by going to the Application Menu
   * and clicking View > Terminal
   */
  async focusTerminal() {
    // If the terminal is already visible
    // then we can focus it by hitting the keyboard shortcut
    const isTerminalVisible = await this.page.isVisible("#terminal")
    if (isTerminalVisible) {
      await this.page.keyboard.press(`Control+Backquote`)
      // Wait for terminal to receive focus
      await this.page.waitForSelector("div.terminal.xterm.focus")
      // Sometimes the terminal reloads
      // which is why we wait for it twice
      await this.page.waitForSelector("div.terminal.xterm.focus")
      return
    }
    // Open using the manu
    // Click [aria-label="Application Menu"] div[role="none"]
    await this.page.click('[aria-label="Application Menu"] div[role="none"]')

    // Click text=View
    await this.page.hover("text=View")
    await this.page.click("text=View")

    // Click text=Terminal
    await this.page.hover("text=Terminal")
    await this.page.click("text=Terminal")

    // Wait for terminal to receive focus
    // Sometimes the terminal reloads once or twice
    // which is why we wait for it to have the focus class
    await this.page.waitForSelector("div.terminal.xterm.focus")
    // Sometimes the terminal reloads
    // which is why we wait for it twice
    await this.page.waitForSelector("div.terminal.xterm.focus")
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
