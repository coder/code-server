import { promises as fs } from "fs"
import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("Webviews", ["--disable-workspace-trust"], {}, () => {
  test("should preview a Markdown file with custom styles", async ({ codeServerPage }) => {
    const heading = "Hello world"
    const dir = await codeServerPage.workspaceDir
    const file = path.join(dir, "text.md")
    const style = path.join(dir, "test.css")
    const settingsPath = path.join(dir, "User/settings.json")
    const settings = JSON.parse(await fs.readFile(settingsPath, "utf8"))

    settings["markdown.styles"] = ["test.css"]
    await fs.writeFile(settingsPath, JSON.stringify(settings))
    await fs.writeFile(style, "h1 { color: rgb(1, 2, 3); }")
    await fs.writeFile(file, `# ${heading}`)

    // Reload so the workbench reads the updated user settings before rendering
    // the Markdown preview.
    await codeServerPage.page.reload()
    await codeServerPage.reloadUntilEditorIsReady()
    await codeServerPage.openFile(file)

    // Open Preview
    await codeServerPage.executeCommandViaMenus("Markdown: Open Preview to the Side")
    // Wait for the iframe to open and load
    await codeServerPage.waitForTab(`Preview ${file}`)

    // It's an iframe within an iframe
    // so we have to do .frameLocator twice
    const previewHeading = codeServerPage.page
      .frameLocator("iframe.webview.ready")
      .frameLocator("#active-frame")
      .getByText(heading)

    await expect(previewHeading).toBeVisible()
    await expect(previewHeading).toHaveCSS("color", "rgb(1, 2, 3)")
  })
})
