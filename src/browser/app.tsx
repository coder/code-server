import * as React from "react"
import { Application } from "../common/api"
import { Route, Switch } from "react-router-dom"
import { HttpError } from "../common/http"
import { Modal } from "./components/modal"
import { getOptions } from "../common/util"

const App: React.FunctionComponent = () => {
  const [authed, setAuthed] = React.useState<boolean>(false)
  const [app, setApp] = React.useState<Application>()
  const [error, setError] = React.useState<HttpError | Error | string>()

  React.useEffect(() => {
    getOptions()
  }, [])

  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).setAuthed = setAuthed
  }

  return (
    <>
      <Switch>
        <Route path="/vscode" render={(): React.ReactElement => <iframe id="iframe" src="/vscode-embed"></iframe>} />
        <Route
          path="/"
          render={(): React.ReactElement => (
            <Modal app={app} setApp={setApp} authed={authed} error={error} setError={setError} />
          )}
        />
      </Switch>
    </>
  )
}

export default App
