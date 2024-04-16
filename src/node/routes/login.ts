import { Router, Request } from "express"
import { promises as fs } from "fs"
import { RateLimiter as Limiter } from "limiter"
import * as path from "path"
import { CookieKeys } from "../../common/http"
import { rootPath } from "../constants"
import { authenticated, getCookieOptions, redirect, replaceTemplates } from "../http"
import i18n from "../i18n"
import { getPasswordMethod, handlePasswordValidation, sanitizeString, escapeHtml } from "../util"

// RateLimiter wraps around the limiter library for logins.
// It allows 2 logins every minute plus 12 logins every hour.
export class RateLimiter {
  private readonly minuteLimiter = new Limiter({ tokensPerInterval: 2, interval: "minute" })
  private readonly hourLimiter = new Limiter({ tokensPerInterval: 12, interval: "hour" })

  public canTry(): boolean {
    // Note: we must check using >= 1 because technically when there are no tokens left
    // you get back a number like 0.00013333333333333334
    // which would cause fail if the logic were > 0
    return this.minuteLimiter.getTokensRemaining() >= 1 || this.hourLimiter.getTokensRemaining() >= 1
  }

  public removeToken(): boolean {
    return this.minuteLimiter.tryRemoveTokens(1) || this.hourLimiter.tryRemoveTokens(1)
  }
}

const getRoot = async (req: Request, error?: Error): Promise<string> => {
  const content = await fs.readFile(path.join(rootPath, "src/browser/pages/login.html"), "utf8")
  const locale = req.args["locale"] || "en"
  i18n.changeLanguage(locale)
  const appName = req.args["app-name"] || "code-server"
  const welcomeText = req.args["welcome-text"] || (i18n.t("WELCOME", { app: appName }) as string)
  let passwordMsg = i18n.t("LOGIN_PASSWORD", { configFile: req.args.config })
  if (req.args.usingEnvPassword) {
    passwordMsg = i18n.t("LOGIN_USING_ENV_PASSWORD")
  } else if (req.args.usingEnvHashedPassword) {
    passwordMsg = i18n.t("LOGIN_USING_HASHED_PASSWORD")
  }

  return replaceTemplates(
    req,
    content
      .replace(/{{I18N_LOGIN_TITLE}}/g, i18n.t("LOGIN_TITLE", { app: appName }))
      .replace(/{{WELCOME_TEXT}}/g, welcomeText)
      .replace(/{{PASSWORD_MSG}}/g, passwordMsg)
      .replace(/{{I18N_LOGIN_BELOW}}/g, i18n.t("LOGIN_BELOW"))
      .replace(/{{I18N_PASSWORD_PLACEHOLDER}}/g, i18n.t("PASSWORD_PLACEHOLDER"))
      .replace(/{{I18N_SUBMIT}}/g, i18n.t("SUBMIT"))
      .replace(/{{ERROR}}/, error ? `<div class="error">${escapeHtml(error.message)}</div>` : ""),
  )
}

const limiter = new RateLimiter()

export const router = Router()

router.use(async (req, res, next) => {
  const to = (typeof req.query.to === "string" && req.query.to) || "/"
  if (await authenticated(req)) {
    return redirect(req, res, to, { to: undefined })
  }
  next()
})

router.get("/", async (req, res) => {
  res.send(await getRoot(req))
})

router.post<{}, string, { password?: string; base?: string } | undefined, { to?: string }>("/", async (req, res) => {
  const password = sanitizeString(req.body?.password)
  const hashedPasswordFromArgs = req.args["hashed-password"]

  try {
    // Check to see if they exceeded their login attempts
    if (!limiter.canTry()) {
      throw new Error(i18n.t("LOGIN_RATE_LIMIT") as string)
    }

    if (!password) {
      throw new Error(i18n.t("MISS_PASSWORD") as string)
    }

    const passwordMethod = getPasswordMethod(hashedPasswordFromArgs)
    const { isPasswordValid, hashedPassword } = await handlePasswordValidation({
      passwordMethod,
      hashedPasswordFromArgs,
      passwordFromRequestBody: password,
      passwordFromArgs: req.args.password,
    })

    if (isPasswordValid) {
      // The hash does not add any actual security but we do it for
      // obfuscation purposes (and as a side effect it handles escaping).
      res.cookie(CookieKeys.Session, hashedPassword, getCookieOptions(req))

      const to = (typeof req.query.to === "string" && req.query.to) || "/"
      return redirect(req, res, to, { to: undefined })
    }

    // Note: successful logins should not count against the RateLimiter
    // which is why this logic must come after the successful login logic
    limiter.removeToken()

    console.error(
      "Failed login attempt",
      JSON.stringify({
        xForwardedFor: req.headers["x-forwarded-for"],
        remoteAddress: req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
        timestamp: Math.floor(new Date().getTime() / 1000),
      }),
    )

    throw new Error(i18n.t("INCORRECT_PASSWORD") as string)
  } catch (error: any) {
    const renderedHtml = await getRoot(req, error)
    res.send(renderedHtml)
  }
})
