import proxyServer from "http-proxy"
import { HttpCode } from "../common/http"

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

// Intercept the response to rewrite absolute redirects against the base path.
// Is disabled when the request has no base path which means /absproxy is in use.
proxy.on("proxyRes", (res, req) => {
  if (res.headers.location && res.headers.location.startsWith("/") && (req as any).base) {
    res.headers.location = (req as any).base + res.headers.location
  }
})
