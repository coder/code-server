import * as cp from "child_process"
import * as path from "path"
import util from "util"
import { clean, getMaybeProxiedCodeServer, tmpdir } from "../utils/helpers"
import { describe, expect, test } from "./baseFixture"

describe("Integrated Terminal", [], {}, () => {
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

    await codeServerPage.page.keyboard.type(`printenv VSCODE_PROXY_URI > ${tmpFile}`)
    await codeServerPage.page.keyboard.press("Enter")

    const { stdout } = await output
    const address = await getMaybeProxiedCodeServer(codeServerPage)
    expect(stdout).toMatch(address)
  })
})
