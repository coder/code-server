import "./views/error/index.css"
import "./views/global.css"
import "./views/login/index.css"

import { getOptions, normalize } from "../common/util"

const options = getOptions()

if ("serviceWorker" in navigator) {
  const path = normalize(`${options.base}/serviceWorker.js`)
  navigator.serviceWorker
    .register(path, {
      scope: (options.base ?? "") + "/",
    })
    .then(() => console.debug("[Code Server Service Worker] registered"))
}
