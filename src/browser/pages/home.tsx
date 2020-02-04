import * as React from "react"
import { RouteComponentProps } from "react-router"
import { authenticate } from "../api"

export const Home: React.FunctionComponent<RouteComponentProps> = (props) => {
  React.useEffect(() => {
    authenticate()
      .then(() => {
        // TEMP: Always redirect to VS Code.
        props.history.push("./vscode/")
      })
      .catch(() => {
        props.history.push("./login/")
      })
  }, [])

  return (
    <div className="orientation-guide">
      <div className="welcome">Welcome to code-server.</div>
    </div>
  )
}
