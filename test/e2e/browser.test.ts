/// <reference types="jest-playwright-preset" />

beforeAll(async () => {
  await page.goto("https://whatismybrowser.com/")
})

test("should display correct browser", async () => {
  const browser = await page.$eval(".string-major", (el) => el.innerHTML)

  const displayNames = {
    chromium: "Chrome",
    firefox: "Firefox",
    webkit: "Safari",
  }
  expect(browser).toContain(displayNames[browserName])
})
