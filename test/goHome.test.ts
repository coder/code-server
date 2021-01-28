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
    await context.close()
  })

  beforeEach(async () => {
    page = await context.newPage()
  })

  afterEach(async () => {
    await page.close()
    // Remove password from local storage
    await context.clearCookies()
  })

  it("should see a 'Go Home' button in the Application Menu that goes to coder.com", async () => {
    const GO_HOME_URL = `${process.env.CODE_SERVER_ADDRESS}/healthz`
    let requestedGoHomeUrl = false
    page.on("request", (request) => {
      // This ensures that we did make a request to the GO_HOME_URL
      // Most reliable way to test button
      // because we don't care if the request has a response
      // only that it was made
      if (request.url() === GO_HOME_URL) {
        requestedGoHomeUrl = true
      }
    })
    // waitUntil: "networkidle"
    // In case the page takes a long time to load
    await page.goto(process.env.CODE_SERVER_ADDRESS || "http://localhost:8080", { waitUntil: "networkidle" })
    // Type in password
    await page.fill(".password", process.env.PASSWORD || "password")
    // Click the submit button and login
    await page.click(".submit")
    // Click the Application menu
    await page.click(".menubar-menu-button[title='Application Menu']")
    // See the Go Home button
    const goHomeButton = "a.action-menu-item span[aria-label='Go Home']"
    expect(await page.isVisible(goHomeButton))
    // Click it and navigate to coder.com
    // NOTE: ran into issues of it failing intermittently
    // without having button: "middle"
    await page.click(goHomeButton, { button: "middle" })

    // If there are unsaved changes it will show a dialog
    // asking if you're sure you want to leave
    page.on("dialog", (dialog) => dialog.accept())

    // We make sure to wait on a request to the GO_HOME_URL
    await page.waitForRequest(GO_HOME_URL)
    expect(requestedGoHomeUrl).toBeTruthy()
  })
})
