import { chromium, Page, Browser, BrowserContext } from "playwright"

describe("login", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async (done) => {
    browser = await chromium.launch()
    // Create a new context with the saved storage state
    const storageState = JSON.parse(process.env.STORAGE || "")
    context = await browser.newContext({ storageState, recordVideo: { dir: "./test/videos/" } })
    done()
  })

  afterAll(async (done) => {
    // Remove password from local storage
    await context.clearCookies()

    await browser.close()
    await context.close()
    done()
  })

  beforeEach(async (done) => {
    page = await context.newPage()
    done()
  })

  it("should see a 'Go Home' button in the Application Menu that goes to /healthz", async (done) => {
    const GO_HOME_URL = `${process.env.CODE_SERVER_ADDRESS}/healthz`
    let requestedGoHomeUrl = false
    page.on("request", (request) => {
      // This ensures that we did make a request to the GO_HOME_URL
      // Most reliable way to test button
      // because we don't care if the request has a response
      // only that it was made
      if (request.url() === GO_HOME_URL) {
        requestedGoHomeUrl = true
        expect(requestedGoHomeUrl).toBeTruthy()

        // This ensures Jest knows we're done here.
        done()
      }
    })
    // Sometimes a dialog shows up when you navigate
    // asking if you're sure you want to leave
    // so we listen if it comes, we accept it
    page.on("dialog", (dialog) => dialog.accept())

    // waitUntil: "domcontentloaded"
    // In case the page takes a long time to load
    await page.goto(process.env.CODE_SERVER_ADDRESS || "http://localhost:8080", { waitUntil: "domcontentloaded" })

    // For some odd reason, the login method used in globalSetup.ts
    // I don't know if it's on playwright clearing our cookies by accident
    // or if it's our cookies disappearing.
    // This means we need an additional check to make sure we're logged in
    // otherwise this test will hang and fail.
    const currentPageURL = await page.url()
    const isLoginPage = currentPageURL.includes("login")
    if (isLoginPage) {
      await page.fill(".password", process.env.PASSWORD || "password")
      // Click the submit button and login
      await page.click(".submit")
    }

    // Click the Application menu
    await page.click(".menubar-menu-button[title='Application Menu']")
    // See the Go Home button
    const goHomeButton = "a.action-menu-item span[aria-label='Go Home']"
    expect(await page.isVisible(goHomeButton))

    // Click it and navigate to /healthz
    // NOTE: ran into issues of it failing intermittently
    // without having button: "middle"
    await page.click(goHomeButton, { button: "middle" })
  })
})
