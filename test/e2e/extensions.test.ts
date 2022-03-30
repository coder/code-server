import * as path from "path"
import { describe, test } from "./baseFixture"

function runTestExtensionTests() {
  // This will only work if the test extension is loaded into code-server.
  test("should have access to VSCODE_PROXY_URI", async ({ codeServerPage }) => {
    const address = await codeServerPage.address()

    await codeServerPage.executeCommandViaMenus("code-server: Get proxy URI")

    await codeServerPage.page.waitForSelector(`text=${address}/proxy/{{port}}`)
  })
}

const flags = ["--extensions-dir", path.join(__dirname, "./extensions")]

describe("Extensions", true, flags, {}, () => {
  runTestExtensionTests()
})

describe("Extensions with --cert", true, [...flags, "--cert"], {}, () => {
  runTestExtensionTests()
})
