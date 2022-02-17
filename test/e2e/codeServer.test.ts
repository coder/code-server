import * as path from "path"
import { promises as fs } from "fs"
import { describe, test, expect } from "./baseFixture"

describe("CodeServer", true, [], () => {
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
    const dir = await codeServerPage.dir()
    const file = path.join(dir, "foo")
    await fs.writeFile(file, "bar")
    await codeServerPage.openFile(file)
  })
})
