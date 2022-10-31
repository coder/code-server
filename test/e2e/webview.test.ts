import { promises as fs } from "fs"
import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("Webviews", ["--disable-workspace-trust"], {}, () => {
  test("should preview a Markdown file", async ({ codeServerPage }) => {
    // Create Markdown file
    const heading = "Hello world"
    const dir = await codeServerPage.workspaceDir
    const file = path.join(dir, "text.md")
    await fs.writeFile(file, `# ${heading}`)
    await codeServerPage.openFile(file)

    // Open Preview
    await codeServerPage.executeCommandViaMenus("Markdown: Open Preview to the Side")
    // Wait for the iframe to open and load
    await codeServerPage.page.waitForTimeout(2000)
    await codeServerPage.waitForTab(`Preview ${file}`)

    let totalCount = 0
    for (const frame of codeServerPage.page.frames()) {
      // Check for heading in frames
      const count = await frame.locator(`text=${heading}`).count()
      totalCount += count
    }

    // One in the file and one in the preview
    expect(totalCount).toBe(2)
  })
})
