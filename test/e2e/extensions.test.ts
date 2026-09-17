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
    await expect(codeServerPage.page.getByText(`Info: proxyUri: ${normalizedAddress}/proxy/{{port}}/`)).toBeVisible()
  })

  runExternalUriTests()
}

function runExternalUriTests(proxyEndpointTemplate?: string) {
  const cases = [
    {
      name: "path",
      input: "http://127.0.0.1:1234/my/path",
      suffix: "/my/path",
    },
    {
      name: "query and fragment",
      input: "http://localhost:1234/my/path?token=abc&mode=preview#section",
      suffix: "/my/path?token%3Dabc%26mode%3Dpreview#section",
    },
    {
      name: "encoded components",
      input: "http://0.0.0.0:1234/my%20path/%23file?token=a%20b#my%20section",
      suffix: "/my%20path/%23file?token%3Da%20b#my%20section",
    },
    {
      name: "root path",
      input: "http://127.0.0.1:1234/",
      suffix: "/",
    },
  ]

  for (const { name, input, suffix } of cases) {
    test(`asExternalUri should preserve ${name}`, async ({ codeServerPage }) => {
      const address = await getMaybeProxiedCodeServer(codeServerPage)
      const normalizedAddress = address.replace(/\/+$/, "")
      const proxyBase = proxyEndpointTemplate
        ? new URL(proxyEndpointTemplate.replace("{{port}}", "1234"), `${normalizedAddress}/`).toString()
        : `${normalizedAddress}/proxy/1234/`

      await codeServerPage.waitForTestExtensionLoaded()
      await codeServerPage.executeCommandViaMenus("code-server: asExternalUri test")

      const inputBox = codeServerPage.page.locator(".quick-input-widget input")
      await inputBox.fill(input)
      await inputBox.press("Enter")

      // The test extension displays URI.toString(), which also encodes query delimiters.
      const output = `${proxyBase.replace(/\/$/, "")}${suffix}`
      await expect(
        codeServerPage.page.getByText(`Info: input: ${input} output: ${output}`, { exact: true }),
      ).toBeVisible()
    })
  }
}

const flags = ["--disable-workspace-trust", "--extensions-dir", path.join(__dirname, "./extensions")]

describe("Extensions", flags, {}, () => {
  runTestExtensionTests()
})

for (const proxyEndpointTemplate of ["./proxy/{{port}}", "https://{{port}}-workspace.example.com"]) {
  describe(
    `Extensions with VSCODE_PROXY_URI=${proxyEndpointTemplate}`,
    flags,
    { VSCODE_PROXY_URI: proxyEndpointTemplate },
    () => {
      runExternalUriTests(proxyEndpointTemplate)
    },
  )
}

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
