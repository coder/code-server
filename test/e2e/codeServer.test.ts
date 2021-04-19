import { test, expect } from "@playwright/test"
import { STORAGE } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

test.describe("CodeServer", () => {
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
    await codeServer.navigate()
  })

  test("should open the default folder if not open", options, async ({ page }) => {
    await codeServer.openFolder()

    // find workspaceStorage in the Explorer menu, which would be open in the User folder
    // which is the default folder that opens
    expect(await page.isVisible("text=workspaceStorage")).toBe(true)
  })

  test("should show the Integrated Terminal", options, async ({ page }) => {
    await codeServer.viewTerminal()
    expect(await page.isVisible("#terminal")).toBe(true)
  })

  test("should open a file with quickOpen", options, async ({ page }) => {
    await codeServer.openFolder()
    await codeServer.quickOpen("extensions.json")
    // If the file is open, we will see an empty array
    // assuming no extensions are installed
    expect(await page.isVisible("text=[]"))
  })
})
