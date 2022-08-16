import { promises as fs } from "fs"
import * as path from "path"
import { clean, tmpdir } from "../utils/helpers"
import { describe, test } from "./baseFixture"

describe("Integrated Terminal", [], {}, () => {
  const testName = "integrated-terminal"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should be able to invoke `code-server` to open a file", async ({ codeServerPage }) => {
    const tmpFolderPath = await tmpdir(testName)
    const tmpFile = path.join(tmpFolderPath, "test-file")
    await fs.writeFile(tmpFile, "test")
    const fileName = path.basename(tmpFile)

    await codeServerPage.focusTerminal()

    await codeServerPage.page.keyboard.type(`code-server ${tmpFile}`)
    await codeServerPage.page.keyboard.press("Enter")

    await codeServerPage.waitForTab(fileName)
  })
})
