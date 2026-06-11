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

    await expect(codeServerPage.page.locator("text=Upload...")).toBeVisible()
  })

  test("should see the 'Show Local' button on Open File", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "Open File..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    await expect(codeServerPage.page.locator("text=Show Local")).toBeVisible()
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

    await expect(codeServerPage.page.locator("text=Upload...")).not.toBeVisible()
  })

  test("should not see the 'Show Local' button on Open File", async ({ codeServerPage }) => {
    // Action
    await codeServerPage.navigateMenus(["File", "Open File..."])
    await codeServerPage.page.waitForSelector(".quick-input-widget")
    await expect(codeServerPage.page.locator("text=Show Local")).not.toBeVisible()
  })
})
