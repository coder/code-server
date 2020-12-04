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
 * monkeyPatch patches the node HTTP/HTTPS library to route all requests through our
 * custom agent from the proxyAgent package.
 */
export function monkeyPatch(vscode: boolean): void {
  if (!process.env.HTTP_PROXY) {
    return
  }

  logger.debug(`using $HTTP_PROXY ${process.env.HTTP_PROXY}`)

  let pa: http.Agent
  // The reasoning for this split is that VS Code's build process does not have
  // esModuleInterop enabled but the code-server one does. As a result depending on where
  // we execute, we either have a default attribute or we don't.
  //
  // I can't enable esModuleInterop in VS Code's build process as it breaks and spits out
  // a huge number of errors.
  if (vscode) {
    pa = new (proxyagent as any)(process.env.HTTP_PROXY)
  } else {
    pa = new (proxyagent as any).default(process.env.HTTP_PROXY)
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
