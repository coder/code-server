import { Router } from "express"
import { CookieKeys } from "../../common/http"
import { getCookieDomain, redirect } from "../http"

import { sanitizeString } from "../util"

export const router = Router()

router.get<{}, undefined, undefined, { base?: string; to?: string }>("/", async (req, res) => {
  const path = sanitizeString(req.query.base) || "/"
  const to = sanitizeString(req.query.to) || "/"

  // Must use the *identical* properties used to set the cookie.
  res.clearCookie(CookieKeys.Session, {
    domain: getCookieDomain(req.headers.host || "", req.args["proxy-domain"]),
    path: decodeURIComponent(path),
    sameSite: "lax",
  })

  return redirect(req, res, to, { to: undefined, base: undefined })
})
