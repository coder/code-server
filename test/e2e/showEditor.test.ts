import { describe, test, expect } from "./baseFixture"

describe("code-server", [], {}, () => {
  test("should always see the editor", async ({ codeServerPage }) => {
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })
})
