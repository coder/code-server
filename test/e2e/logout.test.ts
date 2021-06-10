import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"
import { test, expect } from "./baseFixture"

test.describe("logout", () => {
  // Reset the browser so no cookies are persisted
  // by emptying the storageState
  test.use({
    storageState: {},
  })

  test("should be able login and logout", async ({ codeServerPage }) => {
    // Type in password
    await codeServerPage.page.fill(".password", PASSWORD)
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    // We do this because occassionally code-server doesn't load on Firefox
    // but loads if you reload once or twice
    await codeServerPage.reloadUntilEditorIsReady()
    // Make sure the editor actually loaded
    expect(await codeServerPage.isEditorVisible()).toBe(true)

    // Click the Application menu
    await codeServerPage.page.click("[aria-label='Application Menu']")

    // See the Log out button
    const logoutButton = "a.action-menu-item span[aria-label='Log out']"
    expect(await codeServerPage.page.isVisible(logoutButton)).toBe(true)

    await codeServerPage.page.hover(logoutButton)
    // TODO(@jsjoeio)
    // Look into how we're attaching the handlers for the logout feature
    // We need to see how it's done upstream and add logging to the
    // handlers themselves.
    // They may be attached too slowly, hence why we need this timeout
    await codeServerPage.page.waitForTimeout(2000)

    // Recommended by Playwright for async navigation
    // https://github.com/microsoft/playwright/issues/1987#issuecomment-620182151
    await Promise.all([codeServerPage.page.waitForNavigation(), codeServerPage.page.click(logoutButton)])
    const currentUrl = codeServerPage.page.url()
    expect(currentUrl).toBe(`${CODE_SERVER_ADDRESS}/login`)
  })
})
