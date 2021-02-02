import { chromium, Page, Browser, BrowserContext } from "playwright"

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
    await page.goto(process.env.CODE_SERVER_ADDRESS || "http://localhost:8080")
    // Type in password
    await page.fill(".password", process.env.PASSWORD || "password")
    // Click the submit button and login
    await page.click(".submit")
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()
  })
})
