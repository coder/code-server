import { getBasepath, navigate } from "hookrouter"
import * as React from "react"
import { Application, isExecutableApplication } from "../common/api"
import { HttpError } from "../common/http"
import { normalize, Options } from "../common/util"
import { Logo } from "./components/logo"
import { Modal } from "./components/modal"

export interface AppProps {
  options: Options
}

const App: React.FunctionComponent<AppProps> = (props) => {
  const [authed, setAuthed] = React.useState<boolean>(!!props.options.authed)
  const [app, setApp] = React.useState<Application | undefined>(props.options.app)
  const [error, setError] = React.useState<HttpError | Error | string>()

  React.useEffect(() => {
    if (app && !isExecutableApplication(app)) {
      navigate(normalize(`${getBasepath()}/${app.path}/`, true))
    }
  }, [app])

  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).setAuthed = (a: boolean): void => {
      if (authed !== a) {
        setAuthed(a)
      }
    }
  }

  return (
    <>
      {!app || !app.loaded ? (
        <div className="coder-splash">
          <Logo />
        </div>
      ) : (
        undefined
      )}
      <Modal app={app} setApp={setApp} authed={authed} error={error} setError={setError} />
      {authed && app && app.embedPath ? (
        <iframe id="iframe" src={normalize(`${getBasepath()}/${app.embedPath}/`, true)}></iframe>
      ) : (
        undefined
      )}
    </>
  )
}

export default App
