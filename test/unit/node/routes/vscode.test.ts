import { promises as fs } from "fs"
import * as path from "path"
import { clean, tmpdir } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

describe("vscode", () => {
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

  it("should load all route variations", async () => {
    codeServer = await integration.setup(["--auth=none"], "")

    for (const route of routes) {
      const resp = await codeServer.fetch(route)
      expect(resp.status).toBe(200)
      const html = await resp.text()
      const url = new URL(resp.url) // Check there were no redirections.
      expect(url.pathname + decodeURIComponent(url.search)).toBe(route)
      switch (route) {
        case "/":
        case "/vscode/":
          expect(html).toContain(`src="./static/`)
          break
        case "/vscode":
          expect(html).toContain(`src="./vscode/static/`)
          break
      }
    }
  })

  it("should redirect to the passed in workspace", async () => {
    const workspace = path.join(await tmpdir(testName), "test.code-workspace")
    await fs.writeFile(workspace, "")
    codeServer = await integration.setup(["--auth=none", workspace], "")

    const resp = await codeServer.fetch("/")
    const url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(url.search).toBe(`?workspace=${workspace}`)
  })

  it("should redirect to the passed in directory", async () => {
    const folder = await tmpdir(testName)
    codeServer = await integration.setup(["--auth=none", folder], "")

    const resp = await codeServer.fetch("/")
    const url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(url.search).toBe(`?folder=${folder}`)
  })

  it("should redirect to last query folder/workspace", async () => {
    codeServer = await integration.setup(["--auth=none"], "")

    const folder = await tmpdir(testName)
    const workspace = path.join(await tmpdir(testName), "test.code-workspace")
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
      expect(decodeURIComponent(url.search)).toBe(`?folder=${folder}&workspace=${workspace}`)
      await resp.text()
    }

    // Closing the folder should stop the redirecting.
    resp = await codeServer.fetch("/", undefined, { ew: "true" })
    let url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(decodeURIComponent(url.search)).toBe("?ew=true")
    await resp.text()

    resp = await codeServer.fetch("/")
    url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(decodeURIComponent(url.search)).toBe("")
    await resp.text()
  })

  it("should add the workspace as a query param maintaining the slashes", async () => {
    const workspace = path.join(await tmpdir(testName), "test.code-workspace")
    await fs.writeFile(workspace, "")
    codeServer = await integration.setup(["--auth=none", workspace], "")

    let resp = await codeServer.fetch("/", undefined)

    expect(resp.status).toBe(200)
    const url = new URL(resp.url)
    expect(url.search).toBe(`?workspace=${workspace}`)
    await resp.text()
  })

  it("should do nothing when nothing is passed in", async () => {
    codeServer = await integration.setup(["--auth=none"], "")

    let resp = await codeServer.fetch("/", undefined)

    expect(resp.status).toBe(200)
    const url = new URL(resp.url)
    expect(url.search).toBe("")
    await resp.text()
  })

  it("should add the folder as a query param maintaining the slashes", async () => {
    const folder = await tmpdir(testName)
    codeServer = await integration.setup(["--auth=none", folder], "")

    let resp = await codeServer.fetch("/", undefined)

    expect(resp.status).toBe(200)
    const url = new URL(resp.url)
    expect(url.search).toBe(`?folder=${folder}`)
    await resp.text()
  })

  it("should not redirect when last opened is ignored", async () => {
    codeServer = await integration.setup(["--auth=none", "--ignore-last-opened"], "")

    const folder = await tmpdir(testName)
    const workspace = path.join(await tmpdir(testName), "test.code-workspace")
    let resp = await codeServer.fetch("/", undefined, {
      folder,
      workspace,
    })
    expect(resp.status).toBe(200)
    await resp.text()

    // No redirections.
    resp = await codeServer.fetch("/")
    const url = new URL(resp.url)
    expect(url.pathname).toBe("/")
    expect(decodeURIComponent(url.search)).toBe("")
    await resp.text()
  })
})
