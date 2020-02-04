import { logger } from "@coder/logger"
import * as React from "react"
import { NavLink, Route, RouteComponentProps, Switch } from "react-router-dom"
import { Application, isExecutableApplication } from "../../common/api"
import { HttpError } from "../../common/http"
import { RequestError } from "../components/error"
import { Browse } from "../pages/browse"
import { Home } from "../pages/home"
import { Login } from "../pages/login"
import { Open } from "../pages/open"
import { Recent } from "../pages/recent"
import { Animate } from "./animate"

export interface ModalProps {
  app?: Application
  authed: boolean
  error?: HttpError | Error | string
  setApp(app?: Application): void
  setError(error?: HttpError | Error | string): void
}

export const Modal: React.FunctionComponent<ModalProps> = (props) => {
  const [showModal, setShowModal] = React.useState<boolean>(false)
  const [showBar, setShowBar] = React.useState<boolean>(true)

  const setApp = (app: Application): void => {
    setShowModal(false)
    props.setApp(app)
  }

  React.useEffect(() => {
    // Show the bar when hovering around the top area for a while.
    let timeout: NodeJS.Timeout | undefined
    const hover = (clientY: number): void => {
      if (clientY > 30 && timeout) {
        clearTimeout(timeout)
        timeout = undefined
      } else if (clientY <= 30 && !timeout) {
        timeout = setTimeout(() => setShowBar(true), 1000)
      }
    }

    const iframe =
      props.app && !isExecutableApplication(props.app) && (document.getElementById("iframe") as HTMLIFrameElement)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postIframeMessage = (message: any): void => {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, window.location.origin)
      } else {
        logger.warn("Tried to post message to missing iframe")
      }
    }

    const onHover = (event: MouseEvent | MessageEvent): void => {
      hover((event as MessageEvent).data ? (event as MessageEvent).data.clientY : (event as MouseEvent).clientY)
    }

    const onIframeLoaded = (): void => {
      if (props.app) {
        setApp({ ...props.app, loaded: true })
      }
    }

    // No need to track the mouse if we don't have a hidden bar.
    const hasHiddenBar = !props.error && !showModal && props.app && !showBar

    if (props.app && !isExecutableApplication(props.app)) {
      // Once the iframe reports it has loaded, tell it to bind mousemove and
      // start listening for that instead.
      if (!props.app.loaded) {
        window.addEventListener("message", onIframeLoaded)
      } else if (hasHiddenBar) {
        postIframeMessage({ bind: "mousemove", prop: "clientY" })
        window.removeEventListener("message", onIframeLoaded)
        window.addEventListener("message", onHover)
      }
    } else if (hasHiddenBar) {
      document.addEventListener("mousemove", onHover)
    }

    return (): void => {
      document.removeEventListener("mousemove", onHover)
      window.removeEventListener("message", onHover)
      window.removeEventListener("message", onIframeLoaded)
      if (props.app && !isExecutableApplication(props.app)) {
        postIframeMessage({ unbind: "mousemove" })
      }
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [showBar, props.error, showModal, props.app])

  return props.error || showModal || !props.app || !props.app.loaded ? (
    <div className="modal-container">
      <div className="modal">
        {props.authed && (!props.app || props.app.loaded) ? (
          <aside className="sidebar">
            <nav className="links">
              {!props.authed ? (
                <NavLink className="link" to="/login">
                  Login
                </NavLink>
              ) : (
                undefined
              )}
              {props.authed ? (
                <NavLink className="link" exact to="/recent/">
                  Recent
                </NavLink>
              ) : (
                undefined
              )}
              {props.authed ? (
                <NavLink className="link" exact to="/open/">
                  Open
                </NavLink>
              ) : (
                undefined
              )}
              {props.authed ? (
                <NavLink className="link" exact to="/browse/">
                  Browse
                </NavLink>
              ) : (
                undefined
              )}
            </nav>
            <div className="footer">
              {props.app && props.app.loaded && !props.error ? (
                <button className="close" onClick={(): void => setShowModal(false)}>
                  Close
                </button>
              ) : (
                undefined
              )}
            </div>
          </aside>
        ) : (
          undefined
        )}
        {props.error ? (
          <RequestError
            error={props.error}
            onClose={(): void => {
              props.setApp(undefined)
              props.setError(undefined)
            }}
          />
        ) : (
          <div className="content">
            <Switch>
              <Route path="/login" component={Login} />
              <Route
                path="/recent"
                render={(p: RouteComponentProps): React.ReactElement => (
                  <Recent app={props.app} setApp={setApp} {...p} />
                )}
              />
              <Route path="/browse" component={Browse} />
              <Route
                path="/open"
                render={(p: RouteComponentProps): React.ReactElement => <Open app={props.app} setApp={setApp} {...p} />}
              />
              <Route path="/" component={Home} />
            </Switch>
          </div>
        )}
      </div>
    </div>
  ) : (
    <Animate show={showBar} delay={200}>
      <div className="modal-bar">
        <div className="bar">
          <div className="content">
            <div className="help">
              Hover at the top {/*or press <strong>Ctrl+Shift+G</strong>*/} to display this menu.
            </div>
          </div>
          <div className="open">
            <button className="button" onClick={(): void => setShowModal(true)}>
              Open Modal
            </button>
          </div>
          <button className="close" onClick={(): void => setShowBar(false)}>
            x
          </button>
        </div>
      </div>
    </Animate>
  )
}
