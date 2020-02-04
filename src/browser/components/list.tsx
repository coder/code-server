import * as React from "react"
import { Application, isExecutableApplication, isRunningApplication } from "../../common/api"
import { HttpError } from "../../common/http"
import { getSession, killSession } from "../api"
import { RequestError } from "../components/error"

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
 * Display provided applications or sessions and allow opening them.
 */
export const AppLoader: React.FunctionComponent<AppLoaderProps> = (props) => {
  const [apps, setApps] = React.useState<ReadonlyArray<ApplicationSection>>()
  const [error, setError] = React.useState<HttpError>()

  const refresh = (): void => {
    props
      .getApps()
      .then(setApps)
      .catch((e) => setError(e.message))
  }

  React.useEffect(() => {
    refresh()
  }, [props])

  function open(app: Application): void {
    props.setApp(app)
    if (!isRunningApplication(app) && isExecutableApplication(app)) {
      getSession(app)
        .then((session) => {
          props.setApp({ ...app, ...session })
        })
        .catch(setError)
    }
  }

  if (error) {
    props.setApp(undefined)
    return (
      <RequestError
        error={error}
        onClose={(): void => {
          setError(undefined)
        }}
      />
    )
  }

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

  if (!apps) {
    return (
      <div className="app-loader">
        <div className="loader">loading</div>
      </div>
    )
  }

  return (
    <>
      {apps.map((section, i) => (
        <AppList key={i} open={open} onKilled={refresh} {...section} />
      ))}
    </>
  )
}
