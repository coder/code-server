import { test, expect } from "@playwright/test"
import * as fs from "fs"
import { tmpdir } from "os"
import * as path from "path"

import { STORAGE } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

test.describe("Integrated Terminal", () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const options: any = {}
  const testFileName = "test.txt"
  const testString = "new string test from e2e test"
  let codeServer: CodeServer

  // TODO@jsjoeio
  // Fix this once https://github.com/microsoft/playwright-test/issues/240
  // is fixed
  if (STORAGE) {
    const storageState = JSON.parse(STORAGE) || {}
    options.contextOptions = {
      storageState,
    }
  }
  test.beforeEach(async ({ page }) => {
    codeServer = new CodeServer(page)
    await codeServer.navigate()
  })

  test("should echo a string to a file", options, async ({ page }) => {
    const tmpFolderPath = fs.mkdtempSync(path.join(tmpdir(), "code-server-test"))
    const tmpFile = `${tmpFolderPath}${path.sep}${testFileName}`
    // Open terminal and type in value
    await codeServer.focusTerminal()

    // give the terminal a second to load
    await page.waitForTimeout(3000)
    await page.keyboard.type(`echo '${testString}' > ${tmpFile}`)
    // Wait for the typing to finish before hitting enter
    await page.waitForTimeout(500)
    await page.keyboard.press("Enter")
    await page.waitForTimeout(2000)

    // .access checks if the file exists without opening it
    // it doesn't return anything hence why we expect it to
    // resolve to undefined
    // If the promise rejects (i.e. the file doesn't exist)
    // then the assertion will fail
    await expect(fs.promises.access(tmpFile)).resolves.toBeUndefined()

    await fs.promises.rmdir(tmpFolderPath, { recursive: true })
    // Make sure neither file nor folder exist
    // Note: We have to use ts-ignore because of an upstream typing error
    // See: https://github.com/microsoft/folio/issues/230#event-4621948411
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    expect(fs.promises.access(tmpFile)).rejects.toThrowError(/no such file or directory/)
    // @ts-ignore
    expect(fs.promises.access(tmpFolderPath)).rejects.toThrowError(/no such file or directory/)
  })
})
