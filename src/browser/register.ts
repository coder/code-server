import { logger } from "@coder/logger"
import { getOptions, Options, normalize } from "../common/util"

import "./pages/error.css"
import "./pages/global.css"
import "./pages/login.css"

export async function registerServiceWorker(navigator: Navigator, path: string, options: Options): Promise<void> {
  try {
    await navigator.serviceWorker.register(path, {
      scope: (options.base ?? "") + "/",
    })
    console.log("[Service Worker] registered")
  } catch (error) {
    logger.error(`[Service Worker] failed to register: ${error.message}`)
  }
}

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  const options = getOptions()
  const path = normalize(`${options.csStaticBase}/dist/serviceWorker.js`)
  registerServiceWorker(navigator, path, options)
}
