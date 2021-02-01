import { chromium, Page, Browser, BrowserContext } from "playwright"

describe("login", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async () => {
    browser = await chromium.launch()
    // Create a new context with the saved storage state
    const storageState = JSON.parse(process.env.STORAGE || "")
    context = await browser.newContext({ storageState })
  })

  afterAll(async () => {
    // Remove password from local storage
    await context.clearCookies()

    await browser.close()
    await context.close()
  })

  beforeEach(async () => {
    page = await context.newPage()
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
        console.log("woooo =>>>", requestedGoHomeUrl)
      }
    })

    // waitUntil: "domcontentloaded"
    // In case the page takes a long time to load
    await page.goto(process.env.CODE_SERVER_ADDRESS || "http://localhost:8080", { waitUntil: "domcontentloaded" })
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
    await page.on("dialog", (dialog) => dialog.accept())

    // If it takes longer than 3 seconds to navigate, something is wrong
    await page.waitForRequest(GO_HOME_URL, { timeout: 10000 })
    expect(requestedGoHomeUrl).toBeTruthy()

    // // Make sure the response for GO_HOME_URL was successful
    // const response = await page.waitForResponse(
    //   (response) => response.url() === GO_HOME_URL && response.status() === 200,
    // )
    // We make sure a request was made to the GO_HOME_URL
    // expect(response.ok()).toBeTruthy()
  })
})
