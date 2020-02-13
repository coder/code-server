import { field, logger } from "@coder/logger"
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

let resolved = false
const App: React.FunctionComponent<AppProps> = (props) => {
  const [authed, setAuthed] = React.useState<boolean>(props.options.authed)
  const [app, setApp] = React.useState<RedirectedApplication | undefined>(props.options.app)
  const [error, setError] = React.useState<HttpError | Error | string>()

  if (!resolved && typeof document !== "undefined") {
    // Get the base path. We need the full URL for connecting the web socket.
    // Use the path name plus the provided base path. For example:
    // foo.com/base + ./ => foo.com/base
    // foo.com/base/ + ./ => foo.com/base
    // foo.com/base/bar + ./ => foo.com/base
    // foo.com/base/bar/ + ./../ => foo.com/base
    const parts = window.location.pathname.replace(/^\//g, "").split("/")
    parts[parts.length - 1] = props.options.basePath
    const url = new URL(window.location.origin + "/" + parts.join("/"))
    setBasepath(normalize(url.pathname))
    logger.debug("resolved base path", field("base", getBasepath()))
    resolved = true

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
