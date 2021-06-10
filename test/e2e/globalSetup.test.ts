import { storageState } from "../utils/constants"
import { test, expect } from "./baseFixture"

// This test is to make sure the globalSetup works as expected
// meaning globalSetup ran and stored the storageState
test.describe("globalSetup", () => {
  test.use({
    storageState,
  })

  test("should keep us logged in using the storageState", async ({ codeServerPage }) => {
    // Make sure the editor actually loaded
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })
})
