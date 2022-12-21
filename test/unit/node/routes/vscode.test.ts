import { promises as fs } from "fs"
import * as path from "path"
import { clean, tmpdir } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

// TODO@jsjoeio - move these to integration tests since they rely on Code
// to be built
describe.skip("vscode", () => {
  let codeServer: httpserver.HttpServer | undefined

  const testName = "vscode"
  beforeAll(async () => {
    await clean(testName)
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.dispose()
      codeServer = undefined
    }
  })

  const routes = ["/", "/vscode", "/vscode/"]

  it("should redirect to last query folder/workspace", async () => {
    codeServer = await integration.setup(["--auth=none"], "")

    const folder = await tmpdir(testName)
    const workspace = path.join(await tmpdir(testName), "test.code-workspace")
    await fs.writeFile(workspace, "")
    let resp = await codeServer.fetch("/", undefined, {
      folder,
      workspace,
    })
    expect(resp.status).toBe(200)
    await resp.text()

    // If you visit again without query parameters it will re-attach them by
    // redirecting.  It should always redirect to the same route.
    for (const route of routes) {
      resp = await codeServer.fetch(route)
      const url = new URL(resp.url)
      expect(url.pathname).toBe(route)
      expect(url.search).toBe(`?folder=${folder}&workspace=${workspace}`)
      await resp.text()
    }

    // Closing the folder should stop the redirecting.
    resp = await codeServer.fetch("/", undefined, { ew: "true" })
    let url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(url.search).toBe("?ew=true")
    await resp.text()

    resp = await codeServer.fetch("/")
    url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(url.search).toBe("")
    await resp.text()
  })

  it("should do nothing when nothing is passed in", async () => {
    codeServer = await integration.setup(["--auth=none"], "")

    const resp = await codeServer.fetch("/", undefined)

    expect(resp.status).toBe(200)
    const url = new URL(resp.url)
    expect(url.search).toBe("")
    await resp.text()
  })
})
