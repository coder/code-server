import bodyParser from "body-parser"
import * as express from "express"
import * as httpserver from "../utils/httpserver"
import * as integration from "../utils/integration"

describe("proxy", () => {
  const nhooyrDevServer = new httpserver.HttpServer()
  let codeServer: httpserver.HttpServer | undefined
  let proxyPath: string
  let absProxyPath: string
  let e: express.Express

  beforeAll(async () => {
    await nhooyrDevServer.listen((req, res) => {
      e(req, res)
    })
    proxyPath = `/proxy/${nhooyrDevServer.port()}/wsup`
    absProxyPath = proxyPath.replace("/proxy/", "/absproxy/")
  })

  afterAll(async () => {
    await nhooyrDevServer.close()
  })

  beforeEach(() => {
    e = express.default()
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.close()
      codeServer = undefined
    }
  })

  it("should rewrite the base path", async () => {
    e.get("/wsup", (req, res) => {
      res.json("asher is the best")
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath)
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toBe("asher is the best")
  })

  it("should not rewrite the base path", async () => {
    e.get(absProxyPath, (req, res) => {
      res.json("joe is the best")
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(absProxyPath)
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toBe("joe is the best")
  })

  it("should rewrite redirects", async () => {
    e.post("/wsup", (req, res) => {
      res.redirect(307, "/finale")
    })
    e.post("/finale", (req, res) => {
      res.json("redirect success")
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "POST",
    })
    expect(resp.status).toBe(200)
    expect(await resp.json()).toBe("redirect success")
  })

  it("should not rewrite redirects", async () => {
    const finalePath = absProxyPath.replace("/wsup", "/finale")
    e.post(absProxyPath, (req, res) => {
      res.redirect(307, finalePath)
    })
    e.post(finalePath, (req, res) => {
      res.json("redirect success")
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(absProxyPath, {
      method: "POST",
    })
    expect(resp.status).toBe(200)
    expect(await resp.json()).toBe("redirect success")
  })

  it("should allow post bodies", async () => {
    e.use(bodyParser.json({ strict: false }))
    e.post("/wsup", (req, res) => {
      res.json(req.body)
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "post",
      body: JSON.stringify("coder is the best"),
      headers: {
        "Content-Type": "application/json",
      },
    })
    expect(resp.status).toBe(200)
    expect(await resp.json()).toBe("coder is the best")
  })
})
