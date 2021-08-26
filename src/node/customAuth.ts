import { CodeServerCustomAuth } from "../../typings/customauth"

let customAuth: CodeServerCustomAuth | undefined = undefined

/**
 * Set the custom authentication module to use.
 * Only one such module can be used at a time.
 */
export async function registerCustomAuth(auth: CodeServerCustomAuth) {
  await auth.initialize()
  customAuth = auth
}

/**
 * Get the last registered custom authentication module.
 */
export function getCustomAuth(): CodeServerCustomAuth | undefined {
  return customAuth
}
