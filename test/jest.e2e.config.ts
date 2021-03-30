// jest.config.ts
import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  preset: "jest-playwright-preset",
  transform: {
    "^.+\\.ts$": "<rootDir>/node_modules/ts-jest",
  },
  globalSetup: "<rootDir>/utils/globalSetup.ts",
  testEnvironmentOptions: {
    "jest-playwright": {
      // TODO enable on webkit as well
      // waiting on https://github.com/playwright-community/jest-playwright/issues/659
      browsers: ["chromium", "firefox"],
    },
  },
  testPathIgnorePatterns: ["/node_modules/", "/lib/", "/out/", "test/unit"],
  testTimeout: 30000,
  modulePathIgnorePatterns: [
    "<rootDir>/../lib/vscode",
    "<rootDir>/../release-packages",
    "<rootDir>/../release",
    "<rootDir>/../release-standalone",
    "<rootDir>/../release-npm-package",
    "<rootDir>/../release-gcp",
    "<rootDir>/../release-images",
  ],
}
export default config
