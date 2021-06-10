import { PlaywrightTestConfig } from "@playwright/test"

import path from "path"

// Run tests in three browsers.
const config: PlaywrightTestConfig = {
  testDir: path.join(__dirname, "e2e"), // Search for tests in this directory.
  timeout: 60000, // Each test is given 60 seconds.
  retries: 3, // Retry failing tests 2 times
  workers: 1,
  globalSetup: require.resolve("./utils/globalSetup.ts"),
  reporter: "list",
  // Put any shared options on the top level.
  use: {
    headless: true, // Run tests in headless browsers.
    video: "on",
  },

  projects: [
    {
      name: "Chromium",
      use: { browserName: "chromium" },
    },

    {
      name: "Firefox",
      use: { browserName: "firefox" },
    },

    {
      name: "WebKit",
      use: { browserName: "webkit" },
    },
  ],
}

if (process.env.CI) {
  // In CI, retry failing tests 2 times
  // in the event of flakiness
  config.retries = 2
}

export default config
