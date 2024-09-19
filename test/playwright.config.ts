import { PlaywrightTestConfig } from "@playwright/test"

import path from "path"

// The default configuration runs all tests in three browsers with workers equal
// to half the available threads. See 'yarn test:e2e --help' to customize from
// the command line. For example:
//   yarn test:e2e --workers 1        # Run with one worker
//   yarn test:e2e --project Chromium # Only run on Chromium
//   yarn test:e2e --grep login       # Run tests matching "login"
//   PWDEBUG=1 yarn test:e2e          # Run Playwright inspector
const config: PlaywrightTestConfig = {
  testDir: path.join(__dirname, "e2e"), // Search for tests in this directory.
  timeout: 60000, // Each test is given 60 seconds.
  retries: process.env.CI ? 2 : 1, // Retry in CI due to flakiness.
  // Limit the number of failures on CI to save resources
  maxFailures: process.env.CI ? 3 : undefined,
  globalSetup: require.resolve("./utils/globalE2eSetup.ts"),
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
    // Firefox seems to have bugs with opening context menus in the file tree.
    // {
    //   name: "Firefox",
    //   use: { browserName: "firefox" },
    // },
    {
      name: "WebKit",
      use: { browserName: "webkit" },
    },
  ],
}

export default config
