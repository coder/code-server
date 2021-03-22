// jest.config.ts
import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  transform: {
    "^.+\\.ts$": "<rootDir>/node_modules/ts-jest",
  },
  globalSetup: "<rootDir>/utils/globalSetup.ts",
  testEnvironment: "node",
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
