import { promises as fs } from "fs"
import { Response } from "node-fetch"
import * as path from "path"
import { clean, tmpdir } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

interface WorkbenchConfig {
  folderUri?: {
    path: string
  }
  workspaceUri?: {
    path: string
  }
}

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

  /**
   * Get the workbench config from the provided response.
   */
  const getConfig = async (resp: Response): Promise<WorkbenchConfig> => {
    expect(resp.status).toBe(200)
    const html = await resp.text()
    const match = html.match(/<meta id="vscode-workbench-web-configuration" data-settings="(.+)">/)
    if (!match || !match[1]) {
      throw new Error("Unable to find workbench configuration")
    }
    const config = match[1].replace(/&quot;/g, '"')
    try {
      return JSON.parse(config)
    } catch (error) {
      console.error("Failed to parse workbench configuration", config)
      throw error
    }
  }

  it("should have no default folder or workspace", async () => {
    codeServer = await integration.setup(["--auth=none"], "")

    const config = await getConfig(await codeServer.fetch("/"))
    expect(config.folderUri).toBeUndefined()
    expect(config.workspaceUri).toBeUndefined()
  })

  it("should have a default folder", async () => {
    const defaultDir = await tmpdir(testName)
    codeServer = await integration.setup(["--auth=none", defaultDir], "")

    // At first it will load the directory provided on the command line.
    const config = await getConfig(await codeServer.fetch("/"))
    expect(config.folderUri?.path).toBe(defaultDir)
    expect(config.workspaceUri).toBeUndefined()
  })

  it("should have a default workspace", async () => {
    const defaultWorkspace = path.join(await tmpdir(testName), "test.code-workspace")
    await fs.writeFile(defaultWorkspace, "")
    codeServer = await integration.setup(["--auth=none", defaultWorkspace], "")

    // At first it will load the workspace provided on the command line.
    const config = await getConfig(await codeServer.fetch("/"))
    expect(config.folderUri).toBeUndefined()
    expect(config.workspaceUri?.path).toBe(defaultWorkspace)
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
