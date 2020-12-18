import { logger } from "@coder/logger"
import * as http from "http"
import * as proxyagent from "proxy-agent"

/**
 * This file does not have anything to do with the code-server proxy.
 * It's for $HTTP_PROXY support!
 * - https://github.com/cdr/code-server/issues/124
 * - https://www.npmjs.com/package/proxy-agent
 *
 * This file exists in two locations:
 * - src/node/proxy_agent.ts
 * - lib/vscode/src/vs/base/node/proxy_agent.ts
 * The second is a symlink to the first.
 */

/**
 * monkeyPatch patches the node http and https modules to route all requests through the
 * agent we get from the proxy-agent package.
 *
 * We do not support $HTTPS_PROXY here as it's equivalent in proxy-agent.
 * See the mapping at https://www.npmjs.com/package/proxy-agent
 *
 * I guess with most proxies support both HTTP and HTTPS proxying on the same port and
 * so two variables aren't required anymore. And there's plenty of SOCKS proxies too where
 * it wouldn't make sense to have two variables.
 *
 * It's the most performant/secure setup as using a HTTP proxy for HTTP requests allows
 * for caching but then using a HTTPS proxy for HTTPS requests gives full end to end
 * security.
 *
 * See https://stackoverflow.com/a/10442767/4283659 for HTTP vs HTTPS proxy.
 * To be clear, both support HTTP/HTTPS resources, the difference is in how they fetch
 * them.
 */
export function monkeyPatch(vscode: boolean): void {
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

  // None of our code ever passes in a explicit agent to the http modules but VS Code's
  // does sometimes but only when a user sets the http.proxy configuration.
  // See https://code.visualstudio.com/docs/setup/network#_legacy-proxy-server-support
  //
  // Even if they do, it's probably the same proxy so we should be fine! And those are
  // deprecated anyway. In fact, they implemented it incorrectly as they won't retrieve
  // HTTPS resources over a HTTP proxy which is perfectly valid! Both HTTP and HTTPS proxies
  // support HTTP/HTTPS resources.
  //
  // See https://stackoverflow.com/a/10442767/4283659
  const http = require("http")
  const https = require("https")
  http.globalAgent = pa
  https.globalAgent = pa
}
