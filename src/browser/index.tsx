import * as React from "react"
import * as ReactDOM from "react-dom"
import App from "./app"
import { getOptions } from "../common/util"

import "./app.css"
import "./pages/home.css"
import "./pages/login.css"
import "./pages/missing.css"
import "./components/error.css"
import "./components/list.css"
import "./components/modal.css"

ReactDOM.hydrate(<App options={getOptions()} />, document.getElementById("root"))
