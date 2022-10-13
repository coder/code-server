import { promises as fs } from "fs"
import * as path from "path"
import { getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"
import { CodeServer } from "./models/CodeServer"

describe("code-server", ["--disable-workspace-trust"], {}, () => {
  // TODO@asher: Generalize this?  Could be nice if we were to ever need
  // multiple migration tests in other suites.
  const instances = new Map<string, CodeServer>()
  test.afterAll(async () => {
    const procs = Array.from(instances.values())
    instances.clear()
    await Promise.all(procs.map((cs) => cs.close()))
  })

  test("should navigate to home page", async ({ codeServerPage }) => {
    // We navigate codeServer before each test
    // and we start the test with a storage state
    // which means we should be logged in
    // so it should be on the address
    const url = codeServerPage.page.url()
    // We use match because there may be a / at the end
    // so we don't want it to fail if we expect http://localhost:8080 to match http://localhost:8080/
    const address = await getMaybeProxiedCodeServer(codeServerPage)
    expect(url).toMatch(address)
  })

  test("should always see the code-server editor", async ({ codeServerPage }) => {
    expect(await codeServerPage.isEditorVisible()).toBe(true)
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
})
