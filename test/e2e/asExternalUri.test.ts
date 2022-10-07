import * as path from "path"
import { getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

const flags = ["--extensions-dir", path.join(__dirname, "./extensions")]
describe("asExternalUri", flags, {}, () => {
  test("should use /proxy/port", async ({ codeServerPage }) => {
    // Given
    const port = "3000"
    const input = `http://localhost:${port}`
    const address = await getMaybeProxiedCodeServer(codeServerPage)
    const expected = `${address}/proxy/${port}`

    // When
    await codeServerPage.waitForTestExtensionLoaded()
    await codeServerPage.executeCommandViaMenus("code-server: asExternalUri test")
    await codeServerPage.page.type(".quick-input-widget", input)
    await codeServerPage.page.keyboard.press("Enter")

    // Then
    const text = await codeServerPage.page.locator("text=output").first().textContent()
    expect(text).toBe(`Info: input: ${input} output: ${expected}`)
  })
})

describe(
  "asExternalUri",
  flags,
  { VSCODE_PROXY_URI: "https://{{port}}-main-workspace-name-user-name.coder.com" },
  () => {
    test("should use VSCODE_PROXY_URI", async ({ codeServerPage }) => {
      // Given
      const port = "3000"
      const input = `http://localhost:${port}`
      const expected = `https://${port}-main-workspace-name-user-name.coder.com/`

      // When
      await codeServerPage.waitForTestExtensionLoaded()
      await codeServerPage.executeCommandViaMenus("code-server: asExternalUri test")
      await codeServerPage.page.type(".quick-input-widget", input)
      await codeServerPage.page.keyboard.press("Enter")

      // Then
      const text = await codeServerPage.page.locator("text=output").first().textContent()
      expect(text).toBe(`Info: input: ${input} output: ${expected}`)
    })
  },
)
