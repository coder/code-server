import { PlaywrightTestConfig } from "@playwright/test"

import path from "path"

// Run tests in three browsers.
const config: PlaywrightTestConfig = {
  testDir: path.join(__dirname, "e2e"), // Search for tests in this directory.
  timeout: 60000, // Each test is given 60 seconds.
  retries: process.env.CI ? 2 : 1, // Retry in CI due to flakiness.
  globalSetup: require.resolve("./utils/globalSetup.ts"),
  reporter: "list",
  // Put any shared options on the top level.
  use: {
    headless: true, // Run tests in headless browsers.
    video: "retain-on-failure",
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

export default config
