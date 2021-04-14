import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS, STORAGE } from "../utils/constants"

// This test is to make sure the globalSetup works as expected
// meaning globalSetup ran and stored the storageState in STORAGE
test.describe("globalSetup", () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const options: any = {}

  // TODO@jsjoeio
  // Fix this once https://github.com/microsoft/playwright-test/issues/240
  // is fixed
  if (STORAGE) {
    const storageState = JSON.parse(STORAGE) || {}
    options.contextOptions = {
      storageState,
    }
  }
  test("should keep us logged in using the storageState", options, async ({ page }) => {
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))
  })
})
