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
})
