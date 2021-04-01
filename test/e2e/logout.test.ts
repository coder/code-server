/// <reference types="jest-playwright-preset" />
import { CODE_SERVER_ADDRESS, PASSWORD } from "../utils/constants"

describe("logout", () => {
  beforeEach(async () => {
    await jestPlaywright.resetContext()
  })

  it("should be able login and logout", async () => {
    await page.goto(CODE_SERVER_ADDRESS)
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    // Allow time to navigate
    await page.waitForTimeout(1000)
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()

    // Click the Application menu
    await page.click("[aria-label='Application Menu']")

    // See the Log out button
    const logoutButton = "a.action-menu-item span[aria-label='Log out']"
    expect(await page.isVisible(logoutButton))

    await page.hover(logoutButton)

    await page.click(logoutButton)
    // it takes a couple seconds to navigate
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    expect(currentUrl).toBe(`${CODE_SERVER_ADDRESS}/login`)
  })
})
