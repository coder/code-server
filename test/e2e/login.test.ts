/// <reference types="jest-playwright-preset" />
import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"

describe("login", () => {
  beforeEach(async () => {
    await jestPlaywright.resetBrowser()
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "networkidle" })
  })

  it("should be able to login", async () => {
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    await page.waitForLoadState("networkidle")
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()
  })
})
