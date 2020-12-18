import { logger } from "@coder/logger"
import * as http from "http"
import * as url from "url"
import * as proxyagent from "proxy-agent"

/**
 * This file has nothing to do with the code-server proxy.
 * It is for $HTTP_PROXY and $HTTPS_PROXY support.
 * - https://github.com/cdr/code-server/issues/124
 * - https://www.npmjs.com/package/proxy-agent
 *
 * This file exists in two locations:
 * - src/node/proxy_agent.ts
 * - lib/vscode/src/vs/base/node/proxy_agent.ts
 * The second is a symlink to the first.
 */

/**
 * monkeyPatch patches the node http,https modules to route all requests through the
 * agents we get from the proxy-agent package.
 *
 * This approach only works if there is no code specifying an explicit agent when making
 * a request.
 *
 * None of our code ever passes in a explicit agent to the http,https modules.
 * VS Code's does sometimes but only when a user sets the http.proxy configuration.
 * See https://code.visualstudio.com/docs/setup/network#_legacy-proxy-server-support
 *
 * Even if they do, it's probably the same proxy so we should be fine! And those knobs
 * are deprecated anyway.
 *
 * We use $HTTP_PROXY for all HTTP resources via a normal HTTP proxy.
 * We use $HTTPS_PROXY for all HTTPS resources via HTTP connect.
 * See https://stackoverflow.com/a/10442767/4283659
 */
export function monkeyPatch(inVSCode: boolean): void {
  const http = require("http")
  const https = require("https")

  const httpProxyURL = process.env.HTTP_PROXY || process.env.http_proxy
  if (httpProxyURL) {
    logger.debug(`using $HTTP_PROXY ${httpProxyURL}`)
    http.globalAgent = newProxyAgent(inVSCode, httpProxyURL)
  }

  const httpsProxyURL = process.env.HTTPS_PROXY || process.env.https_proxy
  if (httpsProxyURL) {
    logger.debug(`using $HTTPS_PROXY ${httpsProxyURL}`)
    https.globalAgent = newProxyAgent(inVSCode, httpsProxyURL)
  }
}

function newProxyAgent(inVSCode: boolean, for: "http" | "https", proxyURL: string): http.Agent {
  // The reasoning for this split is that VS Code's build process does not have
  // esModuleInterop enabled but the code-server one does. As a result depending on where
  // we execute, we either have a default attribute or we don't.
  //
  // I can't enable esModuleInterop in VS Code's build process as it breaks and spits out
  // a huge number of errors. And we can't use require as otherwise the modules won't be
  // included in the final product.
  if (inVSCode) {
    return new (proxyagent as any)(opts)
  } else {
    return new (proxyagent as any).default(opts)
  }
}
