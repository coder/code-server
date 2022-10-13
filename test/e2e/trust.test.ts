import { describe, test, expect } from "./baseFixture"

describe("Workspace trust (enabled)", [], {}, async () => {
  test("should see the 'I Trust...' option", async ({ codeServerPage }) => {
    expect(await codeServerPage.page.isVisible("text=Yes, I trust")).toBe(true)
  })
})

describe("Workspace trust (disabled)", ["--disable-workspace-trust"], {}, async () => {
  test("should not see the 'I Trust...' option", async ({ codeServerPage }) => {
    expect(await codeServerPage.page.isVisible("text=Yes, I trust")).toBe(false)
  })
})
