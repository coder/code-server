import { getOptions, normalize } from "../../common/util"
import { ApiEndpoint } from "../../common/http"

import "./error.css"
import "./global.css"
import "./home.css"
import "./login.css"
import "./update.css"

const options = getOptions()

const isInput = (el: Element): el is HTMLInputElement => {
  return !!(el as HTMLInputElement).name
}

document.querySelectorAll("form").forEach((form) => {
  if (!form.classList.contains("-x11")) {
    return
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    const values: { [key: string]: string } = {}
    Array.from(form.elements).forEach((element) => {
      if (isInput(element)) {
        values[element.name] = element.value
      }
    })
    fetch(normalize(`${options.base}/api/${ApiEndpoint.process}`), {
      method: "POST",
      body: JSON.stringify(values),
    })
  })
})

// TEMP: Until we can get the real ready event.
const event = new CustomEvent("ide-ready")
window.dispatchEvent(event)
