import { test, expect } from "@playwright/test"
import { STORAGE } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

// This test is to make sure the globalSetup works as expected
// meaning globalSetup ran and stored the storageState in STORAGE
test.describe("globalSetup", () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const options: any = {}
  let codeServer: CodeServer

  // TODO@jsjoeio
  // Fix this once https://github.com/microsoft/playwright-test/issues/240
  // is fixed
  if (STORAGE) {
    const storageState = JSON.parse(STORAGE) || {}
    options.contextOptions = {
      storageState,
    }
  }
  test.beforeEach(async ({ page }) => {
    codeServer = new CodeServer(page)
    await codeServer.setup()
  })
  test("should keep us logged in using the storageState", options, async ({ page }) => {
    // Make sure the editor actually loaded
    expect(await codeServer.isEditorVisible()).toBe(true)
  })
})
