import { getBasepath, navigate, setBasepath } from "hookrouter"
import * as React from "react"
import { Application, isExecutableApplication } from "../common/api"
import { HttpError } from "../common/http"
import { normalize, Options } from "../common/util"
import { Logo } from "./components/logo"
import { Modal } from "./components/modal"

export interface AppProps {
  options: Options
}

interface RedirectedApplication extends Application {
  redirected?: boolean
}

const origin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : undefined

const App: React.FunctionComponent<AppProps> = (props) => {
  const [authed, setAuthed] = React.useState<boolean>(props.options.authed)
  const [app, setApp] = React.useState<RedirectedApplication | undefined>(props.options.app)
  const [error, setError] = React.useState<HttpError | Error | string>()

  if (typeof window !== "undefined") {
    const url = new URL(origin + props.options.basePath)
    setBasepath(normalize(url.pathname))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).setAuthed = (a: boolean): void => {
      if (authed !== a) {
        setAuthed(a)
      }
    }
  }

  React.useEffect(() => {
    if (app && !isExecutableApplication(app) && !app.redirected) {
      navigate(normalize(`${getBasepath()}/${app.path}/`, true))
      setApp({ ...app, redirected: true })
    }
  }, [app])

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
      {authed && app && app.embedPath && app.redirected ? (
        <iframe id="iframe" src={normalize(`./${app.embedPath}/`, true)}></iframe>
      ) : (
        undefined
      )}
    </>
  )
}

export default App
