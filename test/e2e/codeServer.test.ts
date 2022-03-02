import { promises as fs } from "fs"
import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("CodeServer", true, [], {}, () => {
  test("should navigate to home page", async ({ codeServerPage }) => {
    // We navigate codeServer before each test
    // and we start the test with a storage state
    // which means we should be logged in
    // so it should be on the address
    const url = codeServerPage.page.url()
    // We use match because there may be a / at the end
    // so we don't want it to fail if we expect http://localhost:8080 to match http://localhost:8080/
    expect(url).toMatch(await codeServerPage.address())
  })

  test("should always see the code-server editor", async ({ codeServerPage }) => {
    expect(await codeServerPage.isEditorVisible()).toBe(true)
  })

  test("should always have a connection", async ({ codeServerPage }) => {
    expect(await codeServerPage.isConnected()).toBe(true)
  })

  test("should show the Integrated Terminal", async ({ codeServerPage }) => {
    await codeServerPage.focusTerminal()
    expect(await codeServerPage.page.isVisible("#terminal")).toBe(true)
  })

  test("should open a file", async ({ codeServerPage }) => {
    const dir = await codeServerPage.workspaceDir
    const file = path.join(dir, "foo")
    await fs.writeFile(file, "bar")
    await codeServerPage.openFile(file)
  })

  test("should not share state with other paths", async ({ codeServerPage }) => {
    const dir = await codeServerPage.workspaceDir
    const file = path.join(dir, "foo")
    await fs.writeFile(file, "bar")

    await codeServerPage.openFile(file)

    // If we reload now VS Code will be unable to save the state changes so wait
    // until those have been written to the database.  It flushes every five
    // seconds so we need to wait at least that long.
    await codeServerPage.page.waitForTimeout(5500)

    // The tab should re-open on refresh.
    await codeServerPage.page.reload()
    await codeServerPage.waitForTab(file)

    // The tab should not re-open on a different path.
    await codeServerPage.setup(true, "/vscode")
    expect(await codeServerPage.tabIsVisible(file)).toBe(false)
  })
})
