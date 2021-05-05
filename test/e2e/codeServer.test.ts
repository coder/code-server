import { test, expect } from "@playwright/test"
import { CODE_SERVER_ADDRESS, STORAGE } from "../utils/constants"
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
    await codeServer.setup()
  })

  test(`should navigate to ${CODE_SERVER_ADDRESS}`, options, async ({ page }) => {
    // We navigate codeServer before each test
    // and we start the test with a storage state
    // which means we should be logged in
    // so it should be on the address
    const url = page.url()
    // We use match because there may be a / at the end
    // so we don't want it to fail if we expect http://localhost:8080 to match http://localhost:8080/
    expect(url).toMatch(CODE_SERVER_ADDRESS)
  })

  test("should always see the code-server editor", options, async ({ page }) => {
    expect(await codeServer.isEditorVisible()).toBe(true)
  })

  test("should always have a connection", options, async ({ page }) => {
    expect(await codeServer.isConnected()).toBe(true)
  })

  test("should show the Integrated Terminal", options, async ({ page }) => {
    await codeServer.focusTerminal()
    expect(await page.isVisible("#terminal")).toBe(true)
  })
})
