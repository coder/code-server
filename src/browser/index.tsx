import * as React from "react"
import * as ReactDOM from "react-dom"
import App from "./app"
import { BrowserRouter } from "react-router-dom"

import "./app.css"
import "./pages/home.css"
import "./pages/login.css"
import "./components/error.css"
import "./components/list.css"
import "./components/modal.css"

ReactDOM.hydrate(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
)
