import { getOptions, normalize } from "../common/util"

const options = getOptions()

import "./pages/error.css"
import "./pages/global.css"
import "./pages/login.css"

if ("serviceWorker" in navigator) {
  const path = normalize(`${options.csStaticBase}/dist/serviceWorker.js`)
  navigator.serviceWorker
    .register(path, {
      scope: options.base || "/",
    })
    .then(() => {
      console.log("[Service Worker] registered")
    })
}
