import * as React from "react"
import { Application, isExecutableApplication, isRunningApplication } from "../../common/api"
import { HttpError } from "../../common/http"
import { getSession, killSession } from "../api"
import { RequestError } from "../components/error"

/**
 * An application's details (name and icon).
 */
export const AppDetails: React.FunctionComponent<Application> = (props) => {
  return (
    <>
      {props.icon ? (
        <img className="icon" src={`data:image/png;base64,${props.icon}`}></img>
      ) : (
        <div className="icon -missing"></div>
      )}
      <div className="name">{props.name}</div>
    </>
  )
}

export interface AppRowProps {
  readonly app: Application
  onKilled(app: Application): void
  open(app: Application): void
}

/**
 * A single application row. Can be killed if it's a running application.
 */
export const AppRow: React.FunctionComponent<AppRowProps> = (props) => {
  const [killing, setKilling] = React.useState<boolean>(false)
  const [error, setError] = React.useState<HttpError>()

  function kill(): void {
    if (isRunningApplication(props.app)) {
      setKilling(true)
      killSession(props.app)
        .then(() => {
          setKilling(false)
          props.onKilled(props.app)
        })
        .catch((error) => {
          setError(error)
          setKilling(false)
        })
    }
  }

  return (
    <div className="app-row">
      <button className="launch" onClick={(): void => props.open(props.app)}>
        <AppDetails {...props.app} />
      </button>
      {isRunningApplication(props.app) && !killing ? (
        <button className="kill" onClick={(): void => kill()}>
          {error ? error.message : killing ? "..." : "kill"}
        </button>
      ) : (
        undefined
      )}
    </div>
  )
}

export interface AppListProps {
  readonly header: string
  readonly apps?: ReadonlyArray<Application>
  open(app: Application): void
  onKilled(app: Application): void
}

/**
 * A list of applications. If undefined, show loading text. If empty, show a
 * message saying no items are found. Applications can be clicked and killed
 * (when applicable).
 */
export const AppList: React.FunctionComponent<AppListProps> = (props) => {
  return (
    <div className="app-list">
      <h2 className="header">{props.header}</h2>
      {props.apps && props.apps.length > 0 ? (
        props.apps.map((app, i) => <AppRow key={i} app={app} {...props} />)
      ) : props.apps ? (
        <RequestError error={`No ${props.header.toLowerCase()} found`} />
      ) : (
        <div className="loader">loading...</div>
      )}
    </div>
  )
}

export interface ApplicationSection {
  readonly apps?: ReadonlyArray<Application>
  readonly header: string
}

export interface AppLoaderProps {
  readonly app?: Application
  setApp(app?: Application): void
  getApps(): Promise<ReadonlyArray<ApplicationSection>>
}

/**
 * Application sections/groups. Handles loading of the application
 * sections, errors, opening applications, and killing applications.
 */
export const AppLoader: React.FunctionComponent<AppLoaderProps> = (props) => {
  const [apps, setApps] = React.useState<ReadonlyArray<ApplicationSection>>()
  const [error, setError] = React.useState<HttpError | Error>()

  const refresh = (): void => {
    props
      .getApps()
      .then(setApps)
      .catch((e) => setError(e.message))
  }

  // Every time the component loads go ahead and refresh the list.
  React.useEffect(() => {
    refresh()
  }, [props])

  /**
   * Open an application if not already open. For executable applications create
   * a session first.
   */
  function open(app: Application): void {
    if (props.app && props.app.name === app.name) {
      return setError(new Error(`${app.name} is already open`))
    }
    props.setApp(app)
    if (!isRunningApplication(app) && isExecutableApplication(app)) {
      getSession(app)
        .then((session) => {
          props.setApp({ ...app, ...session })
        })
        .catch((error) => {
          props.setApp(undefined)
          setError(error)
        })
    }
  }

  // In the case of an error fetching the apps, have the ability to try again.
  // In the case of failing to load an app, have the ability to go back to the
  // list (where the user can try again if they wish).
  if (error) {
    return (
      <RequestError
        error={error}
        onCloseText={props.app ? "Go Back" : "Try Again"}
        onClose={(): void => {
          setError(undefined)
          if (!props.app) {
            refresh()
          }
        }}
      />
    )
  }

  // If an app is currently loading, provide the option to cancel.
  if (props.app && !props.app.loaded) {
    return (
      <div className="app-loader">
        <div className="opening">Opening</div>
        <div className="app-row">
          <AppDetails {...props.app} />
        </div>
        <button
          className="cancel"
          onClick={(): void => {
            props.setApp(undefined)
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  // Apps are currently loading.
  if (!apps) {
    return (
      <div className="app-loader">
        <div className="loader">loading...</div>
      </div>
    )
  }

  // Apps have loaded.
  return (
    <>
      {apps.map((section, i) => (
        <AppList key={i} open={open} onKilled={refresh} {...section} />
      ))}
    </>
  )
}
