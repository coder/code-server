import { describe, test, expect } from "./baseFixture"

describe("login", ["--auth", "password"], {}, () => {
  test("should see an error message for missing password", async ({ codeServerPage }) => {
    // Skip entering password
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    expect(await codeServerPage.page.isVisible("text=Missing password"))
  })
})
