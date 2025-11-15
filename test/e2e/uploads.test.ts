import { promises as fs } from "fs"
import * as path from "path"
import { clean } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

describe("Uploads (enabled)", ["--disable-workspace-trust"], {}, () => {
  const testName = "uploads-enabled"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should see the 'Upload...' option", async ({ codeServerPage }) => {
    // Setup
    const workspaceDir = await codeServerPage.workspaceDir
    const tmpDirPath = path.join(workspaceDir, "test-directory")
    await fs.mkdir(tmpDirPath)

    // Action
    await codeServerPage.openContextMenu('span:has-text("test-directory")')

    expect(await codeServerPage.page.isVisible("text=Upload...")).toBe(true)
  })

  test("should see the 'Show Local' button on Open File", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "Open File..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(true)
  })
})

describe("Uploads (disabled)", ["--disable-workspace-trust", "--disable-file-uploads"], {}, () => {
  const testName = "uploads-disabled"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should not see the 'Upload...' option", async ({ codeServerPage }) => {
    // Setup
    const workspaceDir = await codeServerPage.workspaceDir
    const tmpDirPath = path.join(workspaceDir, "test-directory")
    await fs.mkdir(tmpDirPath)

    // Action
    await codeServerPage.openContextMenu('span:has-text("test-directory")')

    expect(await codeServerPage.page.isVisible("text=Upload...")).toBe(false)
  })

  test("should not see the 'Show Local' button on Open File", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "Open File..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    expect(await codeServerPage.page.isVisible("text=Show Local")).toBe(false)
  })
})
