import { getOptions } from "../../common/util"

import "./app.css"
import "./error.css"
import "./global.css"
import "./home.css"
import "./login.css"

const options = getOptions()
const parts = window.location.pathname.replace(/^\//g, "").split("/")
parts[parts.length - 1] = options.base
const url = new URL(window.location.origin + "/" + parts.join("/"))

console.log(url)
