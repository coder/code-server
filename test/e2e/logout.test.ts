import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"

test.describe("logout", () => {
  // Reset the browser so no cookies are persisted
  // by emptying the storageState
  const options = {
    contextOptions: {
      storageState: {},
    },
  }
  test("should be able login and logout", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))

    // Click the Application menu
    await page.click("[aria-label='Application Menu']")

    // See the Log out button
    const logoutButton = "a.action-menu-item span[aria-label='Log out']"
    expect(await page.isVisible(logoutButton))

    await page.hover(logoutButton)
    // TODO(@jsjoeio)
    // Look into how we're attaching the handlers for the logout feature
    // We need to see how it's done upstream and add logging to the
    // handlers themselves.
    // They may be attached too slowly, hence why we need this timeout
    await page.waitForTimeout(2000)

    // Recommended by Playwright for async navigation
    // https://github.com/microsoft/playwright/issues/1987#issuecomment-620182151
    await Promise.all([page.waitForNavigation(), page.click(logoutButton)])
    const currentUrl = page.url()
    expect(currentUrl).toBe(`${CODE_SERVER_ADDRESS}/login`)
  })
})
