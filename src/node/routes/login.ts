import { Router, ErrorRequestHandler } from "express"
import { RateLimiter as Limiter } from "limiter"
import safeCompare from "safe-compare"
import { authenticated, getCookieDomain, redirect, commonTemplateVars } from "../http"
import { hash, humanPath } from "../util"

enum Cookie {
  Key = "key",
}

// RateLimiter wraps around the limiter library for logins.
// It allows 2 logins every minute and 12 logins every hour.
class RateLimiter {
  private readonly minuteLimiter = new Limiter(2, "minute")
  private readonly hourLimiter = new Limiter(12, "hour")

  public try(): boolean {
    if (this.minuteLimiter.tryRemoveTokens(1)) {
      return true
    }
    return this.hourLimiter.tryRemoveTokens(1)
  }
}

const rootHandler: ErrorRequestHandler = async (error: Error | undefined, req, res) => {
  const passwordMsg = req.args.usingEnvPassword
    ? "Password was set from $PASSWORD."
    : `Check the config file at ${humanPath(req.args.config)} for the password.`

  res.render("login", {
    ...commonTemplateVars(req),
    PASSWORD_MSG: passwordMsg,
    ERROR: error?.message || "",
  })
}

const limiter = new RateLimiter()

export const router = Router()

router.use((req, res, next) => {
  const to = (typeof req.query.to === "string" && req.query.to) || "/"
  if (authenticated(req)) {
    return redirect(req, res, to, { to: undefined })
  }
  next()
})

router.get("/", rootHandler.bind(null, null))

router.post("/", async (req, res, next) => {
  try {
    if (!limiter.try()) {
      throw new Error("Login rate limited!")
    }

    if (!req.body.password) {
      throw new Error("Missing password")
    }

    if (req.args.password && safeCompare(req.body.password, req.args.password)) {
      // The hash does not add any actual security but we do it for
      // obfuscation purposes (and as a side effect it handles escaping).
      res.cookie(Cookie.Key, hash(req.body.password), {
        domain: getCookieDomain(req.headers.host || "", req.args["proxy-domain"]),
        path: req.body.base || "/",
        sameSite: "lax",
      })

      const to = (typeof req.query.to === "string" && req.query.to) || "/"
      return redirect(req, res, to, { to: undefined })
    }

    console.error(
      "Failed login attempt",
      JSON.stringify({
        xForwardedFor: req.headers["x-forwarded-for"],
        remoteAddress: req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
        timestamp: Math.floor(new Date().getTime() / 1000),
      }),
    )

    throw new Error("Incorrect password")
  } catch (error) {
    rootHandler(error, req, res, next)
  }
})
