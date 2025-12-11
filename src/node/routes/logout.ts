import { Router } from "express"
import { getCookieOptions, redirect } from "../http"
import { sanitizeString } from "../util"

export const router = Router()

router.get<{}, undefined, undefined, { base?: string; to?: string }>("/", async (req, res) => {
  // Must use the *identical* properties used to set the cookie.
  res.clearCookie(req.cookieSessionName, getCookieOptions(req))

  const to = sanitizeString(req.query.to) || "/"
  return redirect(req, res, to, { to: undefined, base: undefined, href: undefined })
})
