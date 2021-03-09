// Borrowed from playwright
export interface Cookie {
  name: string
  value: string
  domain: string
  path: string
  /**
   * Unix time in seconds.
   */
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite: "Strict" | "Lax" | "None"
}

/**
 * Checks if a cookie exists in array of cookies
 */
export function checkForCookie(cookies: Array<Cookie>, key: string): boolean {
  // Check for a cookie where the name is equal to key
  return Boolean(cookies.find((cookie) => cookie.name === key))
}

/**
 * Creates a login cookie if one doesn't already exist
 */
export function createCookieIfDoesntExist(cookies: Array<Cookie>, cookieToStore: Cookie): Array<Cookie> {
  const cookieName = cookieToStore.name
  const doesCookieExist = checkForCookie(cookies, cookieName)
  if (!doesCookieExist) {
    const updatedCookies = [...cookies, cookieToStore]
    return updatedCookies
  }
  return cookies
}

export const loggerModule = {
  field: jest.fn(),
  level: 2,
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
  },
}
