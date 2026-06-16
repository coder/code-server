import * as cookie from "cookie"
import type { Request } from "express"
import proxyServer from "http-proxy"
import { getCookieSessionName, HttpCode } from "../common/http"

export const proxy = proxyServer.createProxyServer({})

// The error handler catches when the proxy fails to connect (for example when
// there is nothing running on the target port).
proxy.on("error", (error, _, res) => {
  // This could be for either a web socket or a regular request.  Despite what
  // the types say, writeHead() will not exist on web socket requests (nor will
  // status() from Express).  But writing out the code manually does not work
  // for regular requests thus the branching behavior.
  if (typeof res.writeHead !== "undefined") {
    res.writeHead(HttpCode.ServerError)
    res.end(error.message)
  } else {
    res.end(`HTTP/1.1 ${HttpCode.ServerError} ${error.message}\r\n\r\n`)
  }
})

// Strip the code-server cookie if it exists to avoid transmitting the cookie
// to potentially malicious local ports.
proxy.on("proxyReq", (preq, req) => {
  const cookieSessionName = getCookieSessionName((req as Request).args["cookie-suffix"])
  preq.setHeader(
    "Cookie",
    cookie.stringifyCookie({
      ...(req as Request).cookies,
      [cookieSessionName]: undefined,
    }),
  )
})

// Intercept the response to rewrite absolute redirects against the base path.
// Is disabled when the request has no base path which means /absproxy is in use.
proxy.on("proxyRes", (res, req) => {
  if (res.headers.location && res.headers.location.startsWith("/") && (req as any).base) {
    res.headers.location = (req as any).base + res.headers.location
  }
})
