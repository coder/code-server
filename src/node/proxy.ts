import proxyServer from "http-proxy"
import { HttpCode } from "../common/http"

export const proxy = proxyServer.createProxyServer({})

proxy.on("error", (error, _, res) => {
  res.writeHead(HttpCode.ServerError)
  res.end(error.message)
})

// Intercept the response to rewrite absolute redirects against the base path.
// Is disabled when the request has no base path which means /absproxy is in use.
proxy.on("proxyRes", (res, req) => {
  if (res.headers.location && res.headers.location.startsWith("/") && (req as any).base) {
    res.headers.location = (req as any).base + res.headers.location
  }
})
