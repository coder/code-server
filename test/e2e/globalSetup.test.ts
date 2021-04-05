/// <reference types="jest-playwright-preset" />
import { CODE_SERVER_ADDRESS, STORAGE } from "../utils/constants"

// This test is to make sure the globalSetup works as expected
// meaning globalSetup ran and stored the storageState in STORAGE
describe("globalSetup", () => {
  beforeEach(async () => {
    // Create a new context with the saved storage state
    // so we don't have to logged in
    const storageState = JSON.parse(STORAGE) || {}
    await jestPlaywright.resetContext({
      storageState,
    })
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  it("should keep us logged in using the storageState", async () => {
    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))
  })
})
