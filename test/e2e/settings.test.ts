import { promises as fs } from "fs"
import * as path from "path"
import { clean } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

describe("settings", ["--disable-workspace-trust"], {}, () => {
  const testName = "settings-local"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should see startup editor set to none", async ({ codeServerPage }) => {
    await codeServerPage.navigateMenus(["File", "Preferences", "Settings"])
    await codeServerPage.page.waitForSelector(".settings-editor")
    await codeServerPage.page.keyboard.type("startupEditor")
    const el = codeServerPage.page.getByLabel("workbench.startupEditor")
    await expect(el).toHaveValue("none")
  })
})
