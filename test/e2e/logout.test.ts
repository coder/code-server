import { describe, test, expect } from "./baseFixture"

describe("logout", true, () => {
  test("should be able logout", async ({ codeServerPage }) => {
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
    expect(currentUrl).toBe(`${await codeServerPage.address()}/login`)
  })
})
