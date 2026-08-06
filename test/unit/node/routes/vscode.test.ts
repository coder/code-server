import { mockLogger } from "../../../utils/helpers"
import * as httpserver from "../../../utils/httpserver"
import * as integration from "../../../utils/integration"

describe("vscode", () => {
  let codeServer: httpserver.HttpServer | undefined
  // TODO: Support setting this as an argument for tests.
  const previousEnvPassword = process.env.PASSWORD
  beforeEach(() => {
    process.env.PASSWORD = "test"
    mockLogger()
  })

  afterEach(async () => {
    if (typeof previousEnvPassword !== "undefined") {
      process.env.PASSWORD = previousEnvPassword
    } else {
      delete process.env.PASSWORD
    }
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

  it("should require auth", async () => {
    codeServer = await integration.setup(["--auth=password"], "")
    const resp = await codeServer.fetch("/mint-key", { method: "POST" })
    expect(resp.status).toBe(401)
  })
})
