import { describe, test, expect } from "./baseFixture"

describe("Open Help > About", true, () => {
  test("should see a 'Help' then 'About' button in the Application Menu that opens a dialog", async ({
    codeServerPage,
  }) => {
    // Open using the manu
    // Click [aria-label="Application Menu"] div[role="none"]
    await codeServerPage.page.click('[aria-label="Application Menu"] div[role="none"]')

    // Click the Help button
    await codeServerPage.page.hover("text=Help")
    await codeServerPage.page.click("text=Help")

    // Click the About button
    await codeServerPage.page.hover("text=About")
    await codeServerPage.page.click("text=About")

    // Click div[role="dialog"] >> text=code-server
    const element = await codeServerPage.page.waitForSelector('div[role="dialog"] >> text=code-server')
    expect(element).not.toBeNull()
  })
})
