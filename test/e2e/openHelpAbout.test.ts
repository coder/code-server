/// <reference types="jest-playwright-preset" />
import { CODE_SERVER_ADDRESS, STORAGE } from "../utils/constants"

describe("Open Help > About", () => {
  beforeEach(async () => {
    // Create a new context with the saved storage state
    // so we don't have to logged in
    const storageState = JSON.parse(STORAGE) || {}
    await jestPlaywright.resetContext({ storageState })
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  it("should see a 'Help' then 'About' button in the Application Menu that opens a dialog", async () => {
    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))

    // Click the Application menu
    await page.click("[aria-label='Application Menu']")
    // See the Help button
    const helpButton = "a.action-menu-item span[aria-label='Help']"
    expect(await page.isVisible(helpButton))

    // Hover the helpButton
    await page.hover(helpButton)

    // see the About button and click it
    const aboutButton = "a.action-menu-item span[aria-label='About']"
    expect(await page.isVisible(aboutButton))
    // NOTE: it won't work unless you hover it first
    await page.hover(aboutButton)
    await page.click(aboutButton)

    const codeServerText = "text=code-server"
    expect(await page.isVisible(codeServerText))
  })
})
