import { describe, test, expect } from "./baseFixture"

describe("login", ["--auth", "password"], {}, () => {
  test("should see the login page", async ({ codeServerPage }) => {
    // It should send us to the login page
    expect(await codeServerPage.page.title()).toBe("code-server login")
  })
})
