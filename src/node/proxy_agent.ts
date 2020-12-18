import { logger } from "@coder/logger"
import * as http from "http"
import * as proxyagent from "proxy-agent"

/**
 * This file does not have anything to do with the code-server proxy.
 * It's for $HTTP_PROXY support.
 * - https://github.com/cdr/code-server/issues/124
 * - https://www.npmjs.com/package/proxy-agent
 *
 * This file exists in two locations:
 * - src/node/proxy_agent.ts
 * - lib/vscode/src/vs/base/node/proxy_agent.ts
 * The second is a symlink to the first.
 */

/**
 * monkeyPatch patches the node HTTP/HTTPS library to route all requests through our
 * custom agent from the proxyAgent package.
 */
export function monkeyPatch(vscode: boolean): void {
  // We do not support HTTPS_PROXY here to avoid confusion. proxy-agent will automatically
  // use the correct protocol to connect to the proxy depending on the requested URL.
  //
  // We could implement support ourselves to allow people to configure the proxy used for
  // HTTPS vs HTTP but there doesn't seem to be much value in that.
  //
  // At least of right now, it'd just be plain confusing to support HTTPS_PROXY when proxy-agent
  // will still use HTTP to hit it for HTTP requests.
  const proxyURL = process.env.HTTP_PROXY || process.env.http_proxy
  if (!proxyURL) {
    return
  }

  logger.debug(`using $HTTP_PROXY ${proxyURL}`)

  let pa: http.Agent
  // The reasoning for this split is that VS Code's build process does not have
  // esModuleInterop enabled but the code-server one does. As a result depending on where
  // we execute, we either have a default attribute or we don't.
  //
  // I can't enable esModuleInterop in VS Code's build process as it breaks and spits out
  // a huge number of errors.
  if (vscode) {
    pa = new (proxyagent as any)(proxyURL)
  } else {
    pa = new (proxyagent as any).default(proxyURL)
  }

  /**
   * None of our code ever passes in a explicit agent to the http modules but VS Code's
   * does sometimes but only when a user sets the http.proxy configuration.
   * See https://code.visualstudio.com/docs/setup/network#_legacy-proxy-server-support
   *
   * Even if they do, it's probably the same proxy so we should be fine! And those are
   * deprecated anyway.
   */
  const http = require("http")
  const https = require("https")
  http.globalAgent = pa
  https.globalAgent = pa
}
