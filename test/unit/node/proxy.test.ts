import * as express from "express"
import * as http from "http"
import nodeFetch from "node-fetch"
import { HttpCode } from "../../../src/common/http"
import { proxy } from "../../../src/node/proxy"
import { wss, Router as WsRouter } from "../../../src/node/wsRouter"
import { getAvailablePort, mockLogger } from "../../utils/helpers"
import * as httpserver from "../../utils/httpserver"
import * as integration from "../../utils/integration"

describe("proxy", () => {
  const nhooyrDevServer = new httpserver.HttpServer()
  const wsApp = express.default()
  const wsRouter = WsRouter()
  let codeServer: httpserver.HttpServer | undefined
  let proxyPath: string
  let absProxyPath: string
  let e: express.Express

  beforeAll(async () => {
    wsApp.use("/", wsRouter.router)
    await nhooyrDevServer.listen((req, res) => {
      e(req, res)
    })
    nhooyrDevServer.listenUpgrade(wsApp)
    proxyPath = `/proxy/${nhooyrDevServer.port()}/wsup`
    absProxyPath = proxyPath.replace("/proxy/", "/absproxy/")
  })

  afterAll(async () => {
    await nhooyrDevServer.dispose()
  })

  beforeEach(() => {
    e = express.default()
    mockLogger()
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.dispose()
      codeServer = undefined
    }
    jest.clearAllMocks()
  })

  it("should return 403 Forbidden if proxy is disabled", async () => {
    e.get("/wsup", (req, res) => {
      res.json("you cannot see this")
    })
    codeServer = await integration.setup(["--auth=none", "--disable-proxy"], "")
    const resp = await codeServer.fetch(proxyPath)
    expect(resp.status).toBe(403)
    const json = await resp.json()
    expect(json).toEqual({ error: "Forbidden" })
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
    e.use(express.json({ strict: false }))
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

  it("should handle bad requests", async () => {
    e.use(express.json({ strict: false }))
    e.post("/wsup", (req, res) => {
      res.json(req.body)
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "post",
      body: "coder is the best",
      headers: {
        "Content-Type": "application/json",
      },
    })
    expect(resp.status).toBe(400)
    expect(resp.statusText).toMatch("Bad Request")
  })

  it("should handle invalid routes", async () => {
    e.post("/wsup", (req, res) => {
      res.json(req.body)
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(`${proxyPath}/hello`)
    expect(resp.status).toBe(404)
    expect(resp.statusText).toMatch("Not Found")
  })

  it("should handle errors", async () => {
    e.use(express.json({ strict: false }))
    e.post("/wsup", (req, res) => {
      throw new Error("BROKEN")
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "post",
      body: JSON.stringify("coder is the best"),
      headers: {
        "Content-Type": "application/json",
      },
    })
    expect(resp.status).toBe(500)
    expect(resp.statusText).toMatch("Internal Server Error")
  })

  it("should pass origin check", async () => {
    wsRouter.ws("/wsup", async (req) => {
      wss.handleUpgrade(req, req.ws, req.head, (ws) => {
        ws.send("hello")
        req.ws.resume()
      })
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const ws = await codeServer.wsWait(proxyPath, {
      headers: {
        host: "localhost:8080",
        origin: "https://localhost:8080",
      },
    })
    ws.terminate()
  })

  it("should fail origin check", async () => {
    await expect(async () => {
      codeServer = await integration.setup(["--auth=none"], "")
      await codeServer.wsWait(proxyPath, {
        headers: {
          host: "localhost:8080",
          origin: "https://evil.org",
        },
      })
    }).rejects.toThrow()
  })

  it("should proxy non-ASCII", async () => {
    e.get(/.*/, (req, res) => {
      res.json("ほげ")
    })
    codeServer = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath.replace("wsup", "ほげ"))
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toBe("ほげ")
  })

  it("should not double-encode query variables", async () => {
    const spy = jest.fn()
    e.get(/.*/, (req, res) => {
      spy([req.originalUrl, req.query])
      res.end()
    })
    codeServer = await integration.setup(["--auth=none"], "")
    for (const test of [
      {
        endpoint: proxyPath,
        query: { foo: "bar with spaces" },
        expected: "/wsup?foo=bar+with+spaces",
      },
      {
        endpoint: absProxyPath,
        query: { foo: "bar with spaces" },
        expected: absProxyPath + "?foo=bar+with+spaces",
      },
      {
        endpoint: proxyPath,
        query: { foo: "with-&-ampersand" },
        expected: "/wsup?foo=with-%26-ampersand",
      },
      {
        endpoint: absProxyPath,
        query: { foo: "with-&-ampersand" },
        expected: absProxyPath + "?foo=with-%26-ampersand",
      },
      {
        endpoint: absProxyPath,
        query: { foo: "ほげ ほげ" },
        expected: absProxyPath + "?foo=%E3%81%BB%E3%81%92+%E3%81%BB%E3%81%92",
      },
      {
        endpoint: proxyPath,
        query: { foo: "ほげ ほげ" },
        expected: "/wsup?foo=%E3%81%BB%E3%81%92+%E3%81%BB%E3%81%92",
      },
    ]) {
      spy.mockClear()
      const resp = await codeServer.fetch(test.endpoint, undefined, test.query)
      expect(resp.status).toBe(200)
      await resp.text()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith([test.expected, test.query])
    }
  })

  it("should allow specifying an absproxy path", async () => {
    const prefixedPath = `/codeserver/app1${absProxyPath}`
    e.get(prefixedPath, (req, res) => {
      res.send("app being served behind a prefixed path")
    })
    codeServer = await integration.setup(["--auth=none", "--abs-proxy-base-path=/codeserver/app1"], "")
    const resp = await codeServer.fetch(absProxyPath)
    expect(resp.status).toBe(200)
    const text = await resp.text()
    expect(text).toBe("app being served behind a prefixed path")
  })
})

// NOTE@jsjoeio
// Both this test suite and the one above it are very similar
// The main difference is this one uses http and node-fetch
// and specifically tests the proxy in isolation vs. using
// the httpserver abstraction we've built.
//
// Leaving this as a separate test suite for now because
// we may consider refactoring the httpserver abstraction
// in the future.
//
// If you're writing a test specifically for code in
// src/node/proxy.ts, you should probably add it to
// this test suite.
describe("proxy (standalone)", () => {
  let URL = ""
  let PROXY_URL = ""
  let testServer: http.Server
  let proxyTarget: http.Server

  beforeEach(async () => {
    const PORT = await getAvailablePort()
    const PROXY_PORT = await getAvailablePort()
    URL = `http://localhost:${PORT}`
    PROXY_URL = `http://localhost:${PROXY_PORT}`
    // Define server and a proxy server
    testServer = http.createServer((req, res) => {
      proxy.web(req, res, {
        target: PROXY_URL,
      })
    })

    proxyTarget = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end()
    })

    // Start both servers
    proxyTarget.listen(PROXY_PORT)
    testServer.listen(PORT)
  })

  afterEach(async () => {
    testServer.close()
    proxyTarget.close()
  })

  it("should return a 500 when proxy target errors ", async () => {
    // Close the proxy target so that proxy errors
    proxyTarget.close()
    const errorResp = await nodeFetch(`${URL}/error`)
    expect(errorResp.status).toBe(HttpCode.ServerError)
    expect(errorResp.statusText).toBe("Internal Server Error")
  })

  it("should proxy correctly", async () => {
    const resp = await nodeFetch(`${URL}/route`)
    expect(resp.status).toBe(200)
    expect(resp.statusText).toBe("OK")
  })
})
