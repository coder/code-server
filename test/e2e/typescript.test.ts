import { promises as fs } from "fs"
import * as path from "path"
import { describe, test, expect } from "./baseFixture"

const args = ["--disable-workspace-trust"]

describe("typescript extension", args, {}, () => {
  test("should load as a workspace extension", async ({ codeServerPage }) => {
    const dir = await codeServerPage.workspaceDir
    const file = path.join(dir, "foo.ts")
    await fs.writeFile(file, 'const n: number = "x"')
    await codeServerPage.openFile(file)

    await codeServerPage.executeCommandViaMenus("Developer: Show Running Extensions")
    await expect(
      codeServerPage.page.getByLabel("typescript-language-features").getByText(/localhost:\d+/),
    ).toBeVisible()
  })
})
