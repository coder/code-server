import * as cp from "child_process"
import { promises as fs } from "fs"
import * as os from "os"
import * as path from "path"
import * as util from "util"
import { describe, test, expect } from "./baseFixture"
import { CodeServer } from "./models/CodeServer"

describe("code-server", true, [], {}, () => {
  // TODO@asher: Generalize this?  Could be nice if we were to ever need
  // multiple migration tests in other suites.
  const instances = new Map<string, CodeServer>()
  test.afterAll(async () => {
    const procs = Array.from(instances.values())
    instances.clear()
    await Promise.all(procs.map((cs) => cs.close()))
  })

  /**
   * Spawn a specific version of code-server using the install script.
   */
  const spawn = async (version: string, dir?: string): Promise<CodeServer> => {
    let instance = instances.get(version)
    if (!instance) {
      await util.promisify(cp.exec)(`./install.sh --method standalone --version ${version}`, {
        cwd: path.join(__dirname, "../.."),
      })

      instance = new CodeServer(
        "code-server@" + version,
        ["--auth=none"],
        { VSCODE_DEV: "" },
        dir,
        `${os.homedir()}/.local/lib/code-server-${version}`,
      )

      instances.set(version, instance)
    }

    return instance
  }

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

  test("should migrate state to avoid collisions", async ({ codeServerPage }) => {
    // This can take a very long time in development because of how long pages
    // take to load and we are doing a lot of that here.
    test.slow()

    const dir = await codeServerPage.workspaceDir
    const files = [path.join(dir, "foo"), path.join(dir, "bar")]
    await Promise.all(
      files.map((file) => {
        return fs.writeFile(file, path.basename(file))
      }),
    )

    // Open a file in the latest instance.
    await codeServerPage.openFile(files[0])
    await codeServerPage.stateFlush()

    // Open a file in an older version of code-server.  It should not see the
    // file opened in the new instance since the database has a different
    // name.  This must be accessed through the proxy so it shares the same
    // domain and can write to the same database.
    const cs = await spawn("4.0.2", dir)
    const address = new URL(await cs.address())
    await codeServerPage.navigate("/proxy/" + address.port + "/")
    await codeServerPage.openFile(files[1])
    expect(await codeServerPage.tabIsVisible(files[0])).toBe(false)
    await codeServerPage.stateFlush()

    // Move back to latest code-server.  We should see the file we previously
    // opened with it but not the old code-server file because the new instance
    // already created its own database on this path and will avoid migrating.
    await codeServerPage.navigate()
    await codeServerPage.waitForTab(files[0])
    expect(await codeServerPage.tabIsVisible(files[1])).toBe(false)

    // Open a new path in latest code-server.  This one should migrate the
    // database from old code-server but see nothing from the new database
    // created on the root.
    await codeServerPage.navigate("/vscode")
    await codeServerPage.waitForTab(files[1])
    expect(await codeServerPage.tabIsVisible(files[0])).toBe(false)
    // Should still be open after a reload.
    await codeServerPage.navigate("/vscode")
    await codeServerPage.waitForTab(files[1])
    expect(await codeServerPage.tabIsVisible(files[0])).toBe(false)
  })
})
