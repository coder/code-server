import { field, logger } from "@coder/logger"
import { test as base } from "@playwright/test"
import { CodeServer, CodeServerPage } from "./models/CodeServer"

/**
 * Wraps `test.describe` to create and manage an instance of code-server. If you
 * don't use this you will need to create your own code-server instance and pass
 * it to `test.use`.
 *
 * If `includeCredentials` is `true` page requests will be authenticated.
 */
export const describe = (
  name: string,
  includeCredentials: boolean,
  codeServerArgs: string[],
  fn: (codeServer: CodeServer) => void,
) => {
  test.describe(name, () => {
    // This will spawn on demand so nothing is necessary on before.
    const codeServer = new CodeServer(name, codeServerArgs)

    // Kill code-server after the suite has ended. This may happen even without
    // doing it explicitly but it seems prudent to be sure.
    test.afterAll(async () => {
      await codeServer.close()
    })

    const storageState = JSON.parse(process.env.STORAGE || "{}")

    // Sanity check to ensure the cookie is set.
    const cookies = storageState?.cookies
    if (includeCredentials && (!cookies || cookies.length !== 1 || !!cookies[0].key)) {
      logger.error("no cookies", field("storage", JSON.stringify(cookies)))
      throw new Error("no credentials to include")
    }

    test.use({
      // Makes `codeServer` and `authenticated` available to the extend call
      // below.
      codeServer,
      authenticated: includeCredentials,
      // This provides a cookie that authenticates with code-server.
      storageState: includeCredentials ? storageState : {},
      // NOTE@jsjoeio some tests use --cert which uses a self-signed certificate
      // without this option, those tests will fail.
      ignoreHTTPSErrors: true,
    })

    fn(codeServer)
  })
}

interface TestFixtures {
  authenticated: boolean
  codeServer: CodeServer
  codeServerPage: CodeServerPage
}

/**
 * Create a test that spawns code-server if necessary and ensures the page is
 * ready.
 */
export const test = base.extend<TestFixtures>({
  authenticated: false,
  codeServer: undefined, // No default; should be provided through `test.use`.
  codeServerPage: async ({ authenticated, codeServer, page }, use) => {
    // It's possible code-server might prevent navigation because of unsaved
    // changes (seems to happen based on timing even if no changes have been
    // made too). In these cases just accept.
    page.on("dialog", (d) => d.accept())

    const codeServerPage = new CodeServerPage(codeServer, page)
    await codeServerPage.setup(authenticated)
    await use(codeServerPage)
  },
})

/** Shorthand for test.expect. */
export const expect = test.expect
