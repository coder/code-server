import { describe, test, expect } from "./baseFixture"

describe("Open Help > About", true, [], {}, () => {
  test("should see code-server version in about dialog", async ({ codeServerPage }) => {
    // Open using the menu.
    await codeServerPage.navigateMenus(["Help", "About"])

    // Look for code-server info div.
    const element = await codeServerPage.page.waitForSelector('div[role="dialog"] >> text=code-server')
    expect(element).not.toBeNull()
  })
})
