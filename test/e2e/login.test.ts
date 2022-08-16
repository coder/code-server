import { PASSWORD } from "../utils/constants"
import { describe, test, expect } from "./baseFixture"

describe("login", ["--auth", "password"], {}, () => {
  test("should be able to login", async ({ codeServerPage }) => {
    // Type in password
    await codeServerPage.page.fill(".password", PASSWORD)
    // Click the submit button and login
    await codeServerPage.page.click(".submit")
    await codeServerPage.page.waitForLoadState("networkidle")
    // We do this because occassionally code-server doesn't load on Firefox
    // but loads if you reload once or twice
    await codeServerPage.reloadUntilEditorIsReady()
    // Make sure the editor actually loaded
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })
})
