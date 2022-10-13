import { test as base } from "@playwright/test"
import { describe, expect, test } from "./baseFixture"

if (process.env.GITHUB_TOKEN) {
  describe("GitHub token", ["--disable-workspace-trust"], {}, () => {
    test("should be logged in to pull requests extension", async ({ codeServerPage }) => {
      await codeServerPage.exec("git init")
      await codeServerPage.exec("git remote add origin https://github.com/coder/code-server")
      await codeServerPage.installExtension("GitHub.vscode-pull-request-github")
      await codeServerPage.executeCommandViaMenus("View: Show Github")
      await codeServerPage.page.click("text=Sign in")
      await codeServerPage.page.click("text=Allow")
      // It should ask to select an account, one of which will be the one we
      // pre-injected.
      expect(await codeServerPage.page.isVisible("text=Select an account")).toBe(false)
    })
  })

  describe("No GitHub token", ["--disable-workspace-trust"], { GITHUB_TOKEN: "" }, () => {
    test("should not be logged in to pull requests extension", async ({ codeServerPage }) => {
      await codeServerPage.exec("git init")
      await codeServerPage.exec("git remote add origin https://github.com/coder/code-server")
      await codeServerPage.installExtension("GitHub.vscode-pull-request-github")
      await codeServerPage.executeCommandViaMenus("View: Show Github")
      await codeServerPage.page.click("text=Sign in")
      await codeServerPage.page.click("text=Allow")
      // Since there is no account it will ask directly for the token (because
      // we are on localhost; otherwise it would initiate the oauth flow).
      expect(await codeServerPage.page.isVisible("text=GitHub Personal Access Token")).toBe(false)
    })
  })
} else {
  base.describe("GitHub token", () => {
    base.skip("skipped because GITHUB_TOKEN is not set", () => {
      // Playwright will not show this without a function.
    })
  })
}
