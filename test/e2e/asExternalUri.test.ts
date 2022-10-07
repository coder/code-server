import * as path from "path"
import { getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

// TODO@jsjoeio - account for proxy

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
