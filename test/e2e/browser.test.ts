import { test, expect } from "./baseFixture"

// This is a "gut-check" test to make sure playwright is working as expected
test.describe("browser", () => {
  test("browser should display correct userAgent", async ({ codeServerPage, browserName }) => {
    const displayNames = {
      chromium: "Chrome",
      firefox: "Firefox",
      webkit: "Safari",
    }
    const userAgent = await codeServerPage.page.evaluate("navigator.userAgent")

    expect(userAgent).toContain(displayNames[browserName])
  })
})
