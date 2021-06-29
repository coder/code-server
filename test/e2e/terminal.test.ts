import * as cp from "child_process"
import * as fs from "fs"
import * as path from "path"
import util from "util"
import { tmpdir } from "../utils/helpers"
import { describe, expect, test } from "./baseFixture"

describe("Integrated Terminal", true, () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const testFileName = "pipe"
  const testString = "new string test from e2e test"
  let tmpFolderPath = ""
  let tmpFile = ""

  test.beforeAll(async () => {
    tmpFolderPath = await tmpdir("integrated-terminal")
    tmpFile = path.join(tmpFolderPath, testFileName)
  })

  test.afterAll(async () => {
    // Ensure directory was removed
    await fs.promises.rmdir(tmpFolderPath, { recursive: true })
  })

  test("should echo a string to a file", async ({ codeServerPage }) => {
    const command = `mkfifo '${tmpFile}' && cat '${tmpFile}'`
    const exec = util.promisify(cp.exec)
    const output = exec(command, { encoding: "utf8" })

    // Open terminal and type in value
    await codeServerPage.focusTerminal()

    await codeServerPage.page.waitForLoadState("load")
    await codeServerPage.page.keyboard.type(`echo ${testString} > ${tmpFile}`)
    await codeServerPage.page.keyboard.press("Enter")
    // It may take a second to process
    await codeServerPage.page.waitForTimeout(1000)

    const { stdout } = await output
    expect(stdout).toMatch(testString)
  })
})
