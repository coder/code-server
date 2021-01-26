import * as express from "express"
import * as httpserver from "./httpserver"
import * as integration from "./integration"

describe("proxy", () => {
  let codeServer: httpserver.HttpServer | undefined
  const nhooyrDevServer = new httpserver.HttpServer()
  let proxyPath: string

  beforeAll(async () => {
    const e = express.default()
    await nhooyrDevServer.listen(e)
    e.get("/wsup", (req, res) => {
      res.json("asher is the best")
    })
    proxyPath = `/proxy/${nhooyrDevServer.port()}/wsup`
    e.get(proxyPath, (req, res) => {
      res.json("joe is the best")
    })
  })

  afterAll(async () => {
    await nhooyrDevServer.close()
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.close()
      codeServer = undefined
    }
  })

  it("should rewrite the base path", async () => {
    ;[, , codeServer] = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath)
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toBe("asher is the best")
  })

  it("should not rewrite the base path", async () => {
    ;[, , codeServer] = await integration.setup(["--auth=none", "--proxy-path-passthrough=true"], "")
    const resp = await codeServer.fetch(proxyPath)
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toBe("joe is the best")
  })
})
