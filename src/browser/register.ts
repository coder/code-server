import { getOptions, normalize } from "../common/util"

const options = getOptions()

import "./static/assets/error.css"
import "./static/assets/global.css"
import "./static/assets/login.css"

if ("serviceWorker" in navigator) {
  const path = normalize(`${options.base}/serviceWorker.js`)
  navigator.serviceWorker
    .register(path, {
      scope: (options.base ?? "") + "/",
    })
    .then(() => {
      console.log("[Service Worker] registered")
    })
}
