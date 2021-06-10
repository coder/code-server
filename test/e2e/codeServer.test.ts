import { CODE_SERVER_ADDRESS, storageState } from "../utils/constants"
import { test, expect } from "./baseFixture"

test.describe("CodeServer", () => {
  test.use({
    storageState,
  })

  test(`should navigate to ${CODE_SERVER_ADDRESS}`, async ({ codeServerPage }) => {
    // We navigate codeServer before each test
    // and we start the test with a storage state
    // which means we should be logged in
    // so it should be on the address
    const url = codeServerPage.page.url()
    // We use match because there may be a / at the end
    // so we don't want it to fail if we expect http://localhost:8080 to match http://localhost:8080/
    expect(url).toMatch(CODE_SERVER_ADDRESS)
  })

  test("should always see the code-server editor", async ({ codeServerPage }) => {
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })

  test("should always have a connection", async ({ codeServerPage }) => {
    expect(await codeServerPage.isConnected()).toBe(true)
  })

  test("should show the Integrated Terminal", async ({ codeServerPage }) => {
    await codeServerPage.focusTerminal()
    expect(await codeServerPage.page.isVisible("#terminal")).toBe(true)
  })
})
