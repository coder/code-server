import * as path from "path"
import { describe, test, expect } from "./baseFixture"

// Given a code-server environment with Spanish Language Pack extension installed
// and a languagepacks.json in the data-dir
describe("--locale es", ["--extensions-dir", path.join(__dirname, "./extensions"), "--locale", "es"], {}, () => {
  test("should load code-server in Spanish", async ({ codeServerPage }) => {
    // When
    const visible = await codeServerPage.page.isVisible("text=Explorador")

    // Then
    expect(visible).toBe(true)
  })
})
