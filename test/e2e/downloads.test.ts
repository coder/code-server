import { promises as fs } from "fs"
import * as path from "path"
import { clean } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

describe("Downloads (enabled)", ["--disable-workspace-trust"], {}, async () => {
  const testName = "downloads-enabled"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should see the 'Download...' option", async ({ codeServerPage }) => {
    // Setup
    const workspaceDir = await codeServerPage.workspaceDir
    const tmpFilePath = path.join(workspaceDir, "unique-file.txt")
    await fs.writeFile(tmpFilePath, "hello world")

    // Action
    await codeServerPage.openContextMenu("text=unique-file.txt")

    expect(await codeServerPage.page.isVisible("text=Download...")).toBe(true)
  })

  test("should see the 'Show Local' button on Save As", async ({ codeServerPage }) => {
    // Setup
    const workspaceDir = await codeServerPage.workspaceDir
    const fileName = "unique-file-save-as.txt"
    const tmpFilePath = path.join(workspaceDir, fileName)
    await fs.writeFile(tmpFilePath, "Hello World")

    // Action
    await codeServerPage.page.waitForSelector(`text=${fileName}`)

    await codeServerPage.openFile(fileName)
    await codeServerPage.page.click(".tab")
    await codeServerPage.navigateMenus(["File", "Auto Save"])
    await codeServerPage.page.keyboard.type("Making some edits.")
    await codeServerPage.navigateMenus(["File", "Save As..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(true)
  })

  test("should see the 'Show Local' button on Save File", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "New Text File"])
    await codeServerPage.waitForTab("Untitled-1")
    await codeServerPage.navigateMenus(["File", "Save"])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(true)
  })

  test("should see the 'Show Local' button on Save Workspace As", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "Save Workspace As..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(true)
  })
})

describe("Downloads (disabled)", ["--disable-workspace-trust", "--disable-file-downloads"], {}, async () => {
  const testName = "downloads-disabled"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should not see the 'Download...' option", async ({ codeServerPage }) => {
    // Setup
    const workspaceDir = await codeServerPage.workspaceDir
    const tmpFilePath = path.join(workspaceDir, "unique-file.txt")
    await fs.writeFile(tmpFilePath, "Hello World")

    // Action
    await codeServerPage.openContextMenu("text=unique-file.txt")

    expect(await codeServerPage.page.isVisible("text=Download...")).toBe(false)
  })

  test("should not see the 'Show Local' button on Save as", async ({ codeServerPage }) => {
    // Setup
    const workspaceDir = await codeServerPage.workspaceDir
    const fileName = "unique-file-save-as.txt"
    const tmpFilePath = path.join(workspaceDir, fileName)
    await fs.writeFile(tmpFilePath, "Hello World")

    // Action
    await codeServerPage.page.waitForSelector(`text=${fileName}`)
    await codeServerPage.openFile(fileName)
    await codeServerPage.page.click(".tab")
    await codeServerPage.navigateMenus(["File", "Save As..."])
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(false)
  })

  test("should not see the 'Show Local' button on Save File", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "New Text File"])
    await codeServerPage.waitForTab("Untitled-1")
    await codeServerPage.navigateMenus(["File", "Save"])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(false)
  })

  test("should not see the 'Show Local' button on Save Workspace As", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "Save Workspace As..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(false)
  })
})
