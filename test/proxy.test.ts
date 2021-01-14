import * as integration from "./integration"
import * as httpserver from "./httpserver"
import * as express from "express"
import * as assert from "assert"

describe("proxy", () => {
  let codeServer: httpserver.HttpServer | undefined
  let nhooyrDevServer = new httpserver.HttpServer()
  let proxyPath: string

  before(async () => {
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

  after(async () => {
    await nhooyrDevServer.close()
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.close()
      codeServer = undefined
    }
  })

  it("should rewrite the base path", async () => {
    ;[,, codeServer,] = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath)
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "asher is the best")
  })

  it("should not rewrite the base path", async () => {
    ;[,,codeServer,] = await integration.setup(["--auth=none", "--proxy-path-passthrough=true"], "")
    const resp = await codeServer.fetch(proxyPath)
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "joe is the best")
  })
})
