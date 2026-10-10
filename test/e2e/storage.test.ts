import { promises as fs } from "fs"
import * as path from "path"
import { describe, test, expect } from "./baseFixture"

const tests = [
  {
    name: "browser storage",
    args: [],
  },
  {
    name: "remote storage",
    args: ["--enable-remote-storage"],
  },
]

for (const tc of tests) {
  const args = ["--disable-workspace-trust", "--extensions-dir", path.join(__dirname, "./extensions"), ...tc.args]
  describe(tc.name, args, {}, () => {
    test("should store workbench state and secrets", async ({ codeServerPage }) => {
      // Create and open a file.
      const dir = await codeServerPage.workspaceDir
      const file = path.join(dir, "foo")
      await fs.writeFile(file, "bar")
      await codeServerPage.openFile(file)

      // Store a secret.
      const secret = "foo-bar-baz"
      await codeServerPage.waitForTestExtensionLoaded()
      await codeServerPage.executeCommandViaMenus("code-server: Set test secret")
      await codeServerPage.page.waitForSelector(".quick-input-widget:focus-within")
      await codeServerPage.page.keyboard.type(secret)
      await codeServerPage.page.keyboard.press("Enter")
      await expect(codeServerPage.page.getByText(`Info: set secret: ${secret}`)).toBeVisible()

      // There should be a workspace storage directory.
      const userDir = path.join(dir, "User/workspaceStorage")
      const dirs = await fs.readdir(userDir)
      expect(dirs.length).toBe(1)

      const storageFile = path.join(userDir, dirs[0], "state.vscdb")
      if (tc.args.includes("--enable-remote-storage")) {
        // The sqlite database should exist.
        fs.stat(storageFile)
      } else {
        // But no sqlite database.
        expect(() => fs.stat(storageFile)).rejects.toThrow("ENOENT")
      }

      // Reload using a command so it has a chance to flush storage.
      await codeServerPage.executeCommandViaMenus("Developer: Reload Window")
      await codeServerPage.waitForTestExtensionLoaded()

      // Should see the same file.
      await codeServerPage.waitForTab(file)

      // Should be able to retrieve the secret.
      await codeServerPage.executeCommandViaMenus("code-server: Get test secret")
      await expect(codeServerPage.page.getByText(`Info: get secret: ${secret}`)).toBeVisible()
    })
  })
}
