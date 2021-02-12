// This setup runs before our e2e tests
// so that it authenticates us into code-server
// ensuring that we're logged in before we run any tests
import { chromium } from "playwright"
import { CODE_SERVER_ADDRESS, PASSWORD } from "./constants"
import * as wtfnode from "./wtfnode"

module.exports = async () => {
  console.log("\n🚨 Running Global Setup for Jest Tests")
  console.log("     Please hang tight...")
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  if (process.env.WTF_NODE) {
    wtfnode.setup()
  }

  await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "domcontentloaded" })
  // Type in password
  await page.fill(".password", PASSWORD)
  // Click the submit button and login
  await page.click(".submit")

  // Save storage state and store as an env variable
  // More info: https://playwright.dev/docs/auth?_highlight=authe#reuse-authentication-state
  const storage = await context.storageState()
  process.env.STORAGE = JSON.stringify(storage)

  await page.close()
  await browser.close()
  await context.close()
  console.log("✅ Global Setup for Jest Tests is now complete.")
}
