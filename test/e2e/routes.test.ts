import { describe, test, expect } from "./baseFixture"
import { clean, tmpdir } from "../utils/helpers"
import * as path from "path"
import { promises as fs } from "fs"

const routes = ["/", "/vscode", "/vscode/"]

describe("VS Code Routes", ["--disable-workspace-trust"], {}, async () => {
  const testName = "integrated-terminal"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should load all route variations", async ({ codeServerPage }) => {
    for (const route of routes) {
      await codeServerPage.navigate(route)

      // Check there were no redirections
      const url = new URL(codeServerPage.page.url())
      expect(url.pathname).toBe(route)

      // Check that page loaded from correct route
      const html = await codeServerPage.page.innerHTML("html")
      switch (route) {
        case "/":
        case "/vscode/":
          expect(html).toMatch(/src="\.\/[a-z]+-[0-9a-z]+\/static\//)
          break
        case "/vscode":
          expect(html).toMatch(/src="\.\/vscode\/[a-z]+-[0-9a-z]+\/static\//)
          break
      }
    }
  })

  test("should redirect to the passed in workspace using human-readable query", async ({ codeServerPage }) => {
    const workspace = path.join(await tmpdir(testName), "test.code-workspace")
    await fs.writeFile(workspace, "")

    const url = new URL(codeServerPage.page.url())
    expect(url.pathname).toBe("/")
    expect(url.search).toBe(`?workspace=${workspace}`)
  })
})

const CODE_WORKSPACE_DIR = process.env.CODE_WORKSPACE_DIR || ""
describe("VS Code Routes with code-workspace", ["--disable-workspace-trust", CODE_WORKSPACE_DIR], {}, async () => {
  const testName = "vscode-routes"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should redirect to the passed in workspace using human-readable query", async ({ codeServerPage }) => {
    const url = new URL(codeServerPage.page.url())
    expect(url.pathname).toBe("/")
    expect(url.search).toBe(`?workspace=${CODE_WORKSPACE_DIR}`)
  })
})

const CODE_FOLDER_DIR = process.env.CODE_FOLDER_DIR || ""
describe("VS Code Routes with code-workspace", ["--disable-workspace-trust", CODE_FOLDER_DIR], {}, async () => {
  const testName = "vscode-routes"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should redirect to the passed in folder using human-readable query", async ({ codeServerPage }) => {
    const url = new URL(codeServerPage.page.url())
    expect(url.pathname).toBe("/")
    expect(url.search).toBe(`?folder=${CODE_FOLDER_DIR}`)
  })
})

describe(
  "VS Code Routes with ignore-last-opened",
  ["--disable-workspace-trust", "--ignore-last-opened"],
  {},
  async () => {
    test("should not redirect", async ({ codeServerPage }) => {
      await codeServerPage.navigate(`/`)
      // No redirections.
      const url = new URL(codeServerPage.page.url())
      expect(url.pathname).toBe("/")
      expect(url.search).toBe("")
    })
  },
)

describe(
  "VS Code Routes with no workspace or folder",
  ["--disable-workspace-trust"],
  {},
  async () => {
    test("should redirect to last query folder/workspace", async ({ codeServerPage }) => {
      const folder = process.env.CODE_FOLDER_DIR
      const workspace = process.env.CODE_WORKSPACE_DIR
      await codeServerPage.navigate(`/?folder=${folder}&workspace=${workspace}`)

      // If you visit again without query parameters it will re-attach them by
      // redirecting.  It should always redirect to the same route.
      for (const route of routes) {
        await codeServerPage.navigate(route)
        const url = new URL(codeServerPage.page.url())
        expect(url.pathname).toBe(route)
        expect(url.search).toBe(`?folder=${folder}&workspace=${workspace}`)
      }
    })
  },
)

describe(
  "VS Code Routes with no workspace or folder",
  ["--disable-workspace-trust"],
  {},
  async () => {
    test("should not redirect if ew passed in", async ({ codeServerPage }) => {
      const folder = process.env.CODE_FOLDER_DIR
      const workspace = process.env.CODE_WORKSPACE_DIR
      await codeServerPage.navigate(`/?folder=${folder}&workspace=${workspace}`)

      // Closing the folder should stop the redirecting.
      await codeServerPage.navigate("/?ew=true")
      let url = new URL(codeServerPage.page.url())
      expect(url.pathname).toBe("/")
      expect(url.search).toBe("?ew=true")
    })
  },
)