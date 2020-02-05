import * as React from "react"
import { HttpError } from "../../common/http"
import { authenticate } from "../api"
import { FieldError } from "../components/error"

/**
 * Login page. Will redirect on success.
 */
export const Login: React.FunctionComponent = () => {
  const [password, setPassword] = React.useState<string>("")
  const [error, setError] = React.useState<HttpError>()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    authenticate({ password }).catch(setError)
  }

  React.useEffect(() => {
    authenticate().catch(() => undefined)
  }, [])

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-header">
        <div className="main">Welcome to code-server</div>
        <div className="sub">Please log in below</div>
      </div>
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
