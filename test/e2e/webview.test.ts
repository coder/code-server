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
    await codeServerPage.waitForTab(`Preview ${file}`)

    // It's an iframe within an iframe
    // so we have to do .frameLocator twice
    const renderedText = await codeServerPage.page
      .frameLocator("iframe.webview.ready")
      .frameLocator("#active-frame")
      .locator("text=Hello world")

    expect(renderedText).toBeVisible
  })
})
