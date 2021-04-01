/// <reference types="jest-playwright-preset" />
import { CODE_SERVER_ADDRESS, STORAGE } from "../utils/constants"

// This test is to make sure the globalSetup works as expected
// meaning globalSetup ran and stored the storageState in STORAGE
describe("globalSetup", () => {
  beforeEach(async () => {
    // Create a new context with the saved storage state
    // so we don't have to logged in
    const storageState = JSON.parse(STORAGE) || {}
    await jestPlaywright.resetContext({ storageState })
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  it("should keep us logged in if we don't reset the browser", async () => {
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()
  })
})
