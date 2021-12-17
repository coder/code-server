import { Cookie } from "playwright"
import { CookieKeys } from "../../src/common/http"
import { hash } from "../../src/node/util"
import { PASSWORD, workspaceDir } from "./constants"
import { clean } from "./helpers"
import * as wtfnode from "./wtfnode"

/**
 * Perform workspace cleanup and authenticate. This should be ran before e2e
 * tests execute.
 */
export default async function () {
  console.log("\n🚨 Running Global Setup for Playwright End-to-End Tests")
  console.log("   Please hang tight...")

  // Cleanup workspaces from previous tests.
  await clean(workspaceDir)

  if (process.env.WTF_NODE) {
    wtfnode.setup()
  }

  // TODO: Replace this with a call to code-server to get the cookie. To avoid
  // too much overhead we can do an http POST request and avoid spawning a
  // browser for it.
  const cookies: Cookie[] = [
    {
      domain: "localhost",
      expires: -1,
      httpOnly: false,
      name: CookieKeys.Session,
      path: "/",
      sameSite: "Lax",
      secure: false,
      value: await hash(PASSWORD),
    },
  ]

  // Save storage state and store as an env variable
  // More info: https://playwright.dev/docs/auth/#reuse-authentication-state
  process.env.STORAGE = JSON.stringify({ cookies })

  console.log("✅ Global Setup for Playwright End-to-End Tests is now complete.")
}
