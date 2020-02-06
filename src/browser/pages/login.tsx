import * as React from "react"
import { Application } from "../../common/api"
import { HttpError } from "../../common/http"
import { authenticate, setAuthed } from "../api"
import { FieldError } from "../components/error"

export interface LoginProps {
  setApp(app: Application): void
}

/**
 * Login page. Will redirect on success.
 */
export const Login: React.FunctionComponent<LoginProps> = (props) => {
  const [password, setPassword] = React.useState<string>("")
  const [error, setError] = React.useState<HttpError>()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    authenticate({ password })
      .then((response) => {
        if (response.app) {
          props.setApp(response.app)
        }
        setAuthed(true)
      })
      .catch(setError)
  }

  React.useEffect(() => {
    authenticate()
      .then(() => setAuthed(true))
      .catch(() => undefined)
  }, [])

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-header">
        <div className="main">Welcome to code-server</div>
        <div className="sub">Please log in below</div>
      </div>
      <div className="field">
        <input className="user" type="text" autoComplete="username" />
        <input
          autoFocus
          className="password"
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
