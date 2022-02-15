import * as cp from "child_process"
import * as path from "path"
import util from "util"
import { clean, tmpdir } from "../utils/helpers"
import { describe, expect, test } from "./baseFixture"

describe("Integrated Terminal", true, [], () => {
  const testName = "integrated-terminal"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should have access to VSCODE_PROXY_URI", async ({ codeServerPage }) => {
    const tmpFolderPath = await tmpdir(testName)
    const tmpFile = path.join(tmpFolderPath, "pipe")

    const command = `mkfifo '${tmpFile}' && cat '${tmpFile}'`
    const exec = util.promisify(cp.exec)
    const output = exec(command, { encoding: "utf8" })

    // Open terminal and type in value
    await codeServerPage.focusTerminal()

    await codeServerPage.page.waitForLoadState("load")
    await codeServerPage.page.keyboard.type(`printenv VSCODE_PROXY_URI > ${tmpFile}`)
    await codeServerPage.page.keyboard.press("Enter")
    // It may take a second to process
    await codeServerPage.page.waitForTimeout(1000)

    const { stdout } = await output
    expect(stdout).toMatch(await codeServerPage.address())
  })
})
