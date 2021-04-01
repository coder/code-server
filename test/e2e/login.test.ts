/// <reference types="jest-playwright-preset" />
import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"

describe("login", () => {
  beforeEach(async () => {
    await jestPlaywright.resetContext()
    await page.goto(CODE_SERVER_ADDRESS)
  })

  it("should be able to login", async () => {
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    // For some reason, it wasn't waiting for the click and navigation before checking
    // so adding a timeout ensures that we allow the editor time to load
    await page.waitForTimeout(1000)
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()
  })
})
