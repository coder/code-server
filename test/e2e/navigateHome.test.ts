import { getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"

describe("code-server", [], {}, () => {
  test("should navigate to home page", async ({ codeServerPage }) => {
    // We navigate codeServer before each test
    // and we start the test with a storage state
    // which means we should be logged in
    // so it should be on the address
    const url = codeServerPage.page.url()
    // We use match because there may be a / at the end
    // so we don't want it to fail if we expect http://localhost:8080 to match http://localhost:8080/
    const address = await getMaybeProxiedCodeServer(codeServerPage)
    expect(url).toMatch(address)
  })
})
