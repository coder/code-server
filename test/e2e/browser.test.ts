/// <reference types="jest-playwright-preset" />

// This test is for nothing more than to make sure
// tests are running in multiple browsers
describe("Browser gutcheck", () => {
  beforeEach(async () => {
    await jestPlaywright.resetBrowser()
  })

  test("should display correct browser", async () => {
    const displayNames = {
      chromium: "Chrome",
      firefox: "Firefox",
      webkit: "Safari",
    }
    const userAgent = await page.evaluate("navigator.userAgent")

    if (browserName === "firefox") {
      expect(userAgent).toContain(displayNames[browserName])
    }

    if (browserName === "chromium") {
      expect(userAgent).toContain(displayNames[browserName])
    }
  })
})
