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
  async navigate() {
    await this.page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Make sure the editor actually loaded
    await this.page.isVisible("div.monaco-workbench")
  }
  /**
   * Opens the default folder /User if no arg passed
   * @param absolutePath Example: /Users/jp/.local/share/code-server/User/
   *
   */
  async openFolder(absolutePath?: string) {
    // Check if no folder is opened
    const folderIsNotOpen = await this.page.isVisible("text=You have not yet opened")

    if (folderIsNotOpen) {
      // Open the default folder
      await this.page.keyboard.press("Meta+O")
      await this.page.keyboard.press("Enter")
      await this.page.waitForLoadState("networkidle")
    }
  }

  /**
   * Toggles the integrated terminal if not already in view
   * and focuses it
   */
  async viewTerminal() {
    // Check if Terminal is already in view
    const isTerminalInView = await this.page.isVisible("#terminal")

    if (!isTerminalInView) {
      // Open using default keyboard shortcut
      await this.focusTerminal()
      await this.page.waitForSelector("#terminal")
    }
  }

  async focusTerminal() {
    await this.page.keyboard.press("Control+Backquote")
  }

  async quickOpen(input: string) {
    await this.page.keyboard.press("Meta+P")
    await this.page.waitForSelector('[aria-describedby="quickInput_message"]')
    await this.page.keyboard.type(input)
    await this.page.waitForTimeout(2000)
    await this.page.keyboard.press("Enter")
    await this.page.waitForTimeout(2000)
  }
}
