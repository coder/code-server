import * as path from "path"
import { getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

// Setup
const flags = ["--extensions-dir", path.join(__dirname, "./extensions")]

describe("Extensions", flags, {}, () => {
  test("should have access to VSCODE_PROXY_URI", async ({ codeServerPage }) => {
    const address = await getMaybeProxiedCodeServer(codeServerPage)

    await codeServerPage.waitForTestExtensionLoaded()
    await codeServerPage.executeCommandViaMenus("code-server: Get proxy URI")

    await codeServerPage.page.waitForSelector("text=proxyUri", { timeout: 3000 })
    const text = await codeServerPage.page.locator("text=proxyUri").first().textContent()
    // Remove end slash in address
    const normalizedAddress = address.replace(/\/+$/, "")
    expect(text).toBe(`Info: proxyUri: ${normalizedAddress}/proxy/{{port}}`)
  })
})
