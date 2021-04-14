import { chromium, Page, Browser, BrowserContext } from "playwright"
import { CODE_SERVER_ADDRESS, PASSWORD } from "./constants"

describe("login", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async () => {
    browser = await chromium.launch()
    context = await browser.newContext()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await context.newPage()
  })

  afterEach(async () => {
    await page.close()
    // Remove password from local storage
    await context.clearCookies()
  })

  it("should be able to login", async () => {
    await page.goto(CODE_SERVER_ADDRESS)
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()
  })
})
