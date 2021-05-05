import { expect, test } from "@playwright/test"
import * as cp from "child_process"
import * as fs from "fs"
import * as path from "path"
import util from "util"
import { STORAGE } from "../utils/constants"
import { tmpdir } from "../utils/helpers"
import { CodeServer } from "./models/CodeServer"

test.describe("Integrated Terminal", () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const options: any = {}
  const testFileName = "pipe"
  const testString = "new string test from e2e test"
  let codeServer: CodeServer
  let tmpFolderPath = ""
  let tmpFile = ""

  // TODO@jsjoeio
  // Fix this once https://github.com/microsoft/playwright-test/issues/240
  // is fixed
  if (STORAGE) {
    const storageState = JSON.parse(STORAGE) || {}
    options.contextOptions = {
      storageState,
    }
  }
  test.beforeAll(async () => {
    tmpFolderPath = await tmpdir("integrated-terminal")
    tmpFile = path.join(tmpFolderPath, testFileName)
  })

  test.beforeEach(async ({ page }) => {
    codeServer = new CodeServer(page)
    await codeServer.setup()
  })

  test.afterAll(async () => {
    // Ensure directory was removed
    await fs.promises.rmdir(tmpFolderPath, { recursive: true })
  })

  test("should echo a string to a file", options, async ({ page }) => {
    const command = `mkfifo '${tmpFile}' && cat '${tmpFile}'`
    const exec = util.promisify(cp.exec)
    const output = exec(command, { encoding: "utf8" })

    // Open terminal and type in value
    await codeServer.focusTerminal()

    await page.waitForLoadState("load")
    await page.keyboard.type(`echo ${testString} > ${tmpFile}`)
    await page.keyboard.press("Enter")
    // It may take a second to process
    await page.waitForTimeout(1000)

    const { stdout } = await output
    expect(stdout).toMatch(testString)
  })
})
