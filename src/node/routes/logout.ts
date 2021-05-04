import { Router } from "express"
import { getCookieDomain, redirect } from "../http"
import { Cookie } from "./login"

export const router = Router()

router.get("/", async (req, res) => {
  // Must use the *identical* properties used to set the cookie.
  res.clearCookie(Cookie.Key, {
    domain: getCookieDomain(req.headers.host || "", req.args["proxy-domain"]),
    path: req.body.base || "/",
    sameSite: "lax",
  })

  const to = (typeof req.query.to === "string" && req.query.to) || "/"
  return redirect(req, res, to, { to: undefined, base: undefined })
})
