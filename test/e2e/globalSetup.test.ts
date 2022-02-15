import { describe, test, expect } from "./baseFixture"

// This test is to make sure the globalSetup works as expected
// meaning globalSetup ran and stored the storageState
describe("globalSetup", true, [], () => {
  test("should keep us logged in using the storageState", async ({ codeServerPage }) => {
    // Make sure the editor actually loaded
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })
})
