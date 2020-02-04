import * as React from "react"
import { RouteComponentProps } from "react-router"
import { HttpError } from "../../common/http"
import { authenticate } from "../api"
import { FieldError } from "../components/error"

/**
 * Login page. Will redirect on success.
 */
export const Login: React.FunctionComponent<RouteComponentProps> = (props) => {
  const [password, setPassword] = React.useState<string>("")
  const [error, setError] = React.useState<HttpError>()

  function redirect(): void {
    // TEMP: Always redirect to VS Code.
    console.log("is authed")
    props.history.push("../vscode/")
    // const params = new URLSearchParams(window.location.search)
    // props.history.push(params.get("to") || "/")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    authenticate({ password })
      .then(redirect)
      .catch(setError)
  }

  React.useEffect(() => {
    authenticate()
      .then(redirect)
      .catch(() => {
        // Do nothing; we're already at the login page.
      })
  }, [])

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="field">
        <input
          autoFocus
          className="input"
          type="password"
          placeholder="password"
          autoComplete="current-password"
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setPassword(event.target.value)}
        />
        <button className="submit" type="submit">
          Log In
        </button>
      </div>
      {error ? <FieldError error={error} /> : undefined}
    </form>
  )
}
