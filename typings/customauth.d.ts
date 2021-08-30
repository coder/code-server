import type { Request, Response, Router } from "express"

/**
 * Modules assigned to the custom-auth-module configuration option
 * must export a "customAuth" property implementing this interface.
 */
export interface CodeServerCustomAuth {
  /**
   * A GET request to the "/" path of the loginRouter is made when the user needs to login.
   */
  readonly loginRouter: Router

  /**
   * A GET request to the "/" path of the logoutRouter is made when the user needs to logout.
   */
  readonly logoutRouter: Router

  /**
   * Runs once when code-server starts. It will block startup until the returned
   * promise resolves.
   */
  initialize(): Promise<void>

  /**
   * Tells if the user is authenticated and authorized.
   *
   * @param req the request that needs to be authorized.
   * @param res the current response.
   * @returns true if the user is authorized, false otherwise.
   */
  authenticated(req: Request, res: Response): Promise<boolean>
}
