import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS, STORAGE } from "../utils/constants"

test.describe("Open Help > About", () => {
  test.beforeEach(async ({ page }) => {
    // Create a new context with the saved storage state
    // so we don't have to logged in
    // TODO@jsjoeio reset context and use storageState
    const storageState = JSON.parse(STORAGE) || {}
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  test("should see a 'Help' then 'About' button in the Application Menu that opens a dialog", async ({ page }) => {
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
