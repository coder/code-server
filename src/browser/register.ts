import { getOptions, normalize } from "../common/util"

const options = getOptions()

if ("serviceWorker" in navigator) {
  const path = normalize(`${options.base}/static/${options.commit}/dist/serviceWorker.js`)
  navigator.serviceWorker
    .register(path, {
      scope: options.base || "/",
    })
    .then(function() {
      console.log("[Service Worker] registered")
    })
}
