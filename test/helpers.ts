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
