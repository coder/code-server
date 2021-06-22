import { chromium } from "playwright"
import { hash } from "../../src/node/util"
import { PASSWORD, workspaceDir } from "./constants"
import { clean } from "./helpers"
import * as wtfnode from "./wtfnode"

/**
 * Perform workspace cleanup and authenticate. This should be set up to run
 * before our tests execute.
 */
export default async function () {
  console.log("\n🚨 Running Global Setup for Playwright End-to-End Tests")
  console.log("   Please hang tight...")

  // Cleanup workspaces from previous tests.
  await clean(workspaceDir)

  const cookieToStore = {
    sameSite: "Lax" as const,
    name: "key",
    value: await hash(PASSWORD),
    domain: "localhost",
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()
  const storage = await page.context().storageState()

  if (process.env.WTF_NODE) {
    wtfnode.setup()
  }

  storage.cookies = [cookieToStore]

  // Save storage state and store as an env variable
  // More info: https://playwright.dev/docs/auth/#reuse-authentication-state
  process.env.STORAGE = JSON.stringify(storage)
  await browser.close()

  console.log("✅ Global Setup for Playwright End-to-End Tests is now complete.")
}
