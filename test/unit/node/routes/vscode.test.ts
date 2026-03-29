import { mockLogger } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

describe("vscode", () => {
  let codeServer: httpserver.HttpServer | undefined
  beforeEach(() => {
    mockLogger()
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.dispose()
      codeServer = undefined
    }
    jest.clearAllMocks()
  })

  it("should fail origin check", async () => {
    await expect(async () => {
      codeServer = await integration.setup(["--auth=none"], "")
      await codeServer.wsWait("/vscode", {
        headers: {
          host: "localhost:8080",
          origin: "https://evil.org",
        },
      })
    }).rejects.toThrow()
  })

  it("should apply app-name to the VS Code product configuration", async () => {
    const appName = "testnäme"
    codeServer = await integration.setup(["--auth=none", `--app-name=${appName}`], "")

    const resp = await codeServer.fetch("/vscode")
    const htmlContent = await resp.text()

    expect(resp.status).toBe(200)
    expect(htmlContent).toContain(`\"nameShort\":\"${appName}\"`)
    expect(htmlContent).toContain(`\"nameLong\":\"${appName}\"`)
  })
})
