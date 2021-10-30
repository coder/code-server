/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ProxyAgent from "proxy-agent"
import { getProxyForUrl } from "proxy-from-env"

/**
 * This file has nothing to do with the code-server proxy.
 * It is to support $HTTP_PROXY, $HTTPS_PROXY and $NO_PROXY.
 *
 * - https://github.com/cdr/code-server/issues/124
 * - https://www.npmjs.com/package/proxy-agent
 * - https://www.npmjs.com/package/proxy-from-env
 *
 */

/**
 * monkeyPatch patches the node http,https modules to route all requests through the
 * agent we get from the proxy-agent package.
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
 */
export function monkeyPatchProxyProtocols(): void {
  if (!shouldEnableProxy()) {
    return
  }

  const http = require("http")
  const https = require("https")

  // If we do not pass in a proxy URL, proxy-agent will get the URL from the environment.
  // See https://www.npmjs.com/package/proxy-from-env.
  // Also see shouldEnableProxy.
  const pa = new ProxyAgent()
  http.globalAgent = pa
  https.globalAgent = pa
}

const sampleUrls = [new URL("http://example.com"), new URL("https://example.com")]

// If they have $NO_PROXY set to example.com then this check won't work!
// But that's drastically unlikely.
export function shouldEnableProxy(): boolean {
  const testedProxyEndpoints = sampleUrls.map((url) => {
    return {
      url,
      proxyUrl: getProxyForUrl(url.toString()),
    }
  })

  let shouldEnable = false

  for (const { url, proxyUrl } of testedProxyEndpoints) {
    if (proxyUrl) {
      console.debug(`${url.protocol} -- Using "${proxyUrl}"`)
      shouldEnable = true
    }
  }

  return shouldEnable
}
