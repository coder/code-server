import {
  ChromiumEnv,
  FirefoxEnv,
  WebKitEnv,
  test,
  setConfig,
  PlaywrightOptions,
  Config,
  globalSetup,
} from "@playwright/test"
import * as bcrypt from "bcrypt"
import path from "path"
import { PASSWORD } from "./utils/constants"
import * as wtfnode from "./utils/wtfnode"

// Playwright doesn't like that ../src/node/util has an enum in it
// so I had to copy hash in separately
const hash = (str: string): string => {
  return bcrypt.hashSync(str, 10)
}

const cookieToStore = {
  sameSite: "Lax" as const,
  name: "key",
  value: hash(PASSWORD),
  domain: "localhost",
  path: "/",
  expires: -1,
  httpOnly: false,
  secure: false,
}

globalSetup(async () => {
  console.log("\n🚨 Running globalSetup for playwright end-to-end tests")
  console.log("👋 Please hang tight...")

  if (process.env.WTF_NODE) {
    wtfnode.setup()
  }

  const storage = {
    cookies: [cookieToStore],
  }

  // Save storage state and store as an env variable
  // More info: https://playwright.dev/docs/auth?_highlight=authe#reuse-authentication-state
  process.env.STORAGE = JSON.stringify(storage)
  console.log("✅ globalSetup is now complete.")
})

const config: Config = {
  testDir: path.join(__dirname, "e2e"), // Search for tests in this directory.
  timeout: 60000, // Each test is given 60 seconds.
  retries: 3, // Retry failing tests 2 times
  workers: 1,
}

if (process.env.CI) {
  // In CI, retry failing tests 2 times
  // in the event of flakiness
  config.retries = 2
}

setConfig(config)

const options: PlaywrightOptions = {
  headless: true, // Run tests in headless browsers.
  video: "on",
}

// Run tests in three browsers.
test.runWith(new ChromiumEnv(options), { tag: "chromium" })
test.runWith(new FirefoxEnv(options), { tag: "firefox" })
test.runWith(new WebKitEnv(options), { tag: "webkit" })
