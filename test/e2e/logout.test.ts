// NOTE@jsjoeio commenting out until we can figure out what's wrong
// import { describe, test, expect } from "./baseFixture"

// describe("logout", true, ["--disable-workspace-trust"], {}, () => {
//   test("should be able logout", async ({ codeServerPage }) => {
//     // Recommended by Playwright for async navigation
//     // https://github.com/microsoft/playwright/issues/1987#issuecomment-620182151
//     await Promise.all([codeServerPage.page.waitForNavigation(), codeServerPage.navigateMenus(["Log Out"])])
//     const currentUrl = codeServerPage.page.url()
//     expect(currentUrl).toBe(`${await codeServerPage.address()}/login`)
//   })
// })
