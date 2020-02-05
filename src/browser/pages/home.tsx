import * as React from "react"
import { Application } from "../../common/api"
import { authenticate } from "../api"

export interface HomeProps {
  app?: Application
}

export const Home: React.FunctionComponent<HomeProps> = (props) => {
  React.useEffect(() => {
    authenticate().catch(() => undefined)
  }, [])

  return (
    <div className="orientation-guide">
      <div className="welcome">Welcome to code-server.</div>
      {props.app && !props.app.loaded ? <div className="loader">loading...</div> : undefined}
    </div>
  )
}
