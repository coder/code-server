import { getOptions, normalize, logError } from "../common/util"

import "./pages/error.css"
import "./pages/global.css"
import "./pages/login.css"

async function registerServiceWorker(): Promise<void> {
  const options = getOptions()
  const path = normalize(`${options.csStaticBase}/dist/serviceWorker.js`)
  try {
    await navigator.serviceWorker.register(path, {
      scope: (options.base ?? "") + "/",
    })
    console.log("[Service Worker] registered")
  } catch (error) {
    logError(`[Service Worker] registration`, error)
  }
}

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  registerServiceWorker()
} else {
  console.error(`[Service Worker] navigator is undefined`)
}
