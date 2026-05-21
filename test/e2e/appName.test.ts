import { version } from "../../src/node/constants"
import { describe, test, expect } from "./baseFixture"

const appName = "testnäme"
describe("--app-name", [`--app-name=${appName}`], {}, () => {
  test("should use app-name for the title", async ({ codeServerPage }) => {
    expect(await codeServerPage.page.title()).toContain(appName)
  })
})
