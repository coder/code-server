import { test, expect } from "@playwright/test"
import { STORAGE } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

test.describe("Integrated Terminal", () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const options: any = {}
  const testFileName = "hello.txt"
  const testString = "new string test from e2e test"
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
    await codeServer.navigate()
  })

  test("should echo a string to a file", options, async ({ page }) => {
    // Open the default folder
    await codeServer.openFolder()

    // Open terminal and type in value
    await codeServer.viewTerminal()
    await codeServer.focusTerminal()

    await page.keyboard.type(`echo '${testString}' >> ${testFileName}`)
    await page.keyboard.press("Enter")
    await page.waitForTimeout(2000)
    // It should show up on the left sidebar as a new file
    const isFileVisible = await page.isVisible(`text="${testFileName}"`)
    expect(isFileVisible).toBe(true)

    if (isFileVisible) {
      // Check that the file has the test string in it
      await codeServer.quickOpen(testFileName)
      expect(await page.isVisible(`text="${testString}"`)).toBe(true)

      // Clean up
      // Remove file
      await codeServer.focusTerminal()
      await page.keyboard.type(`rm ${testFileName}`)
      await page.keyboard.press("Enter")
      await page.waitForTimeout(2000)
      // Close the file from workbench
      // otherwise it will still be visible
      // and our assertion will fail
      await page.keyboard.press(`Meta+W`)
      expect(await page.isVisible(`text="${testString}"`)).toBe(false)
    }
  })
})
