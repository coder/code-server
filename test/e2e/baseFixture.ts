import { field, logger } from "@coder/logger"
import { test as base } from "@playwright/test"
import { CodeServer, CodeServerPage } from "./models/CodeServer"

/**
 * Wraps `test.describe` to create and manage an instance of code-server. If you
 * don't use this you will need to create your own code-server instance and pass
 * it to `test.use`.
 */
export const describe = (name: string, fn: (codeServer: CodeServer) => void) => {
  test.describe(name, () => {
    // This will spawn on demand so nothing is necessary on before.
    const codeServer = new CodeServer(name)

    // Kill code-server after the suite has ended. This may happen even without
    // doing it explicitly but it seems prudent to be sure.
    test.afterAll(async () => {
      await codeServer.close()
    })

    // This makes `codeServer` available to the extend call below.
    test.use({ codeServer })

    fn(codeServer)
  })
}

interface TestFixtures {
  codeServer: CodeServer
  codeServerPage: CodeServerPage
}

/**
 * Create a test that spawns code-server if necessary and ensures the page is
 * ready.
 */
export const test = base.extend<TestFixtures>({
  codeServer: undefined, // No default; should be provided through `test.use`.
  codeServerPage: async ({ codeServer, page }, use) => {
    const codeServerPage = new CodeServerPage(codeServer, page)
    await codeServerPage.navigate()
    await use(codeServerPage)
  },
})

/** Shorthand for test.expect. */
export const expect = test.expect
