// This setup runs before our e2e tests
// so that it authenticates us into code-server
// ensuring that we're logged in before we run any tests
import { chromium, Page, Browser, BrowserContext } from "playwright"

module.exports = async () => {
  const browser: Browser = await chromium.launch()
  const context: BrowserContext = await browser.newContext()
  const page: Page = await context.newPage()

  await page.goto(process.env.CODE_SERVER_ADDRESS || "http://localhost:8080", { waitUntil: "domcontentloaded" })
  // Type in password
  await page.fill(".password", process.env.PASSWORD || "password")
  // Click the submit button and login
  await page.click(".submit")

  // Save storage state and store as an env variable
  // More info: https://playwright.dev/docs/auth?_highlight=authe#reuse-authentication-state
  const storage = await context.storageState()
  process.env.STORAGE = JSON.stringify(storage)

  await page.close()
  await browser.close()
  await context.close()
}
