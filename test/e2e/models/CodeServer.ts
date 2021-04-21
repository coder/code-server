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
      await this.page.keyboard.press(`Meta+Backquote`)
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
  }
}
