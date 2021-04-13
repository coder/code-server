import { ChromiumEnv, FirefoxEnv, WebKitEnv, test, setConfig, PlaywrightOptions } from "@playwright/test"

setConfig({
  testDir: "e2e", // Search for tests in this directory.
  timeout: 30000, // Each test is given 30 seconds.
})

const options: PlaywrightOptions = {
  headless: true, // Run tests in headless browsers.
  video: "retain-on-failure",
}

// Run tests in three browsers.
test.runWith(new ChromiumEnv(options), { tag: "chromium" })
test.runWith(new FirefoxEnv(options), { tag: "firefox" })
test.runWith(new WebKitEnv(options), { tag: "webkit" })
