import { test as base } from "@playwright/test"
import { CodeServer } from "./models/CodeServer"

export const test = base.extend<{ codeServerPage: CodeServer }>({
  codeServerPage: async ({ page }, use) => {
    const codeServer = new CodeServer(page)
    await codeServer.navigate()
    await use(codeServer)
  },
})

export const expect = test.expect
