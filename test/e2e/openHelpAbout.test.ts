import { test, expect } from "@playwright/test"
import { STORAGE } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

test.describe("Open Help > About", () => {
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

  test(
    "should see a 'Help' then 'About' button in the Application Menu that opens a dialog",
    options,
    async ({ page }) => {
      // Open using the manu
      // Click [aria-label="Application Menu"] div[role="none"]
      await page.click('[aria-label="Application Menu"] div[role="none"]')

      // Click the Help button
      await page.hover("text=Help")
      await page.click("text=Help")

      // Click the About button
      await page.hover("text=About")
      await page.click("text=About")

      // Click div[role="dialog"] >> text=code-server
      const element = await page.waitForSelector('div[role="dialog"] >> text=code-server')
      expect(element).not.toBeNull()
    },
  )
})
