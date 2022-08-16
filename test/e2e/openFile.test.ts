import { promises as fs } from "fs"
import * as path from "path"
import { describe, test } from "./baseFixture"

describe("code-server", [], {}, () => {
  test("should open a file", async ({ codeServerPage }) => {
    const dir = await codeServerPage.workspaceDir
    const file = path.join(dir, "foo")
    await fs.writeFile(file, "bar")
    await codeServerPage.openFile(file)
  })
})
