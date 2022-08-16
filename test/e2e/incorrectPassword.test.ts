import { describe, test, expect } from "./baseFixture"

describe("login", ["--auth", "password"], {}, () => {
  test("should see an error message for incorrect password", async ({ codeServerPage }) => {
    // Type in password
    await codeServerPage.page.fill(".password", "password123")
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    expect(await codeServerPage.page.isVisible("text=Incorrect password"))
  })
})
