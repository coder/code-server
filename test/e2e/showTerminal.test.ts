import { describe, test, expect } from "./baseFixture"

describe("code-server", [], {}, () => {
  test("should show the Integrated Terminal", async ({ codeServerPage }) => {
    await codeServerPage.focusTerminal()
    expect(await codeServerPage.page.isVisible("#terminal")).toBe(true)
  })
})
