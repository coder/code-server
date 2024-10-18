import { test as base } from "@playwright/test"
import * as path from "path"
import { getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

function runTestExtensionTests() {
  // This will only work if the test extension is loaded into code-server.
  test("should have access to VSCODE_PROXY_URI", async ({ codeServerPage }) => {
    const address = await getMaybeProxiedCodeServer(codeServerPage)

    await codeServerPage.waitForTestExtensionLoaded()
    await codeServerPage.executeCommandViaMenus("code-server: Get proxy URI")

    // Remove end slash in address.
    const normalizedAddress = address.replace(/\/+$/, "")
    await codeServerPage.page.getByText(`Info: proxyUri: ${normalizedAddress}/proxy/{{port}}/`)
  })
}

const flags = ["--disable-workspace-trust", "--extensions-dir", path.join(__dirname, "./extensions")]

describe("Extensions", flags, {}, () => {
  runTestExtensionTests()
})

if (process.env.USE_PROXY !== "1") {
  describe("Extensions with --cert", [...flags, "--cert"], {}, () => {
    runTestExtensionTests()
  })
} else {
  base.describe("Extensions with --cert", () => {
    base.skip("skipped because USE_PROXY is set", () => {
      // Playwright will not show this without a function.
    })
  })
}
