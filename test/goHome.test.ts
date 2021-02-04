import { chromium, Page, Browser, BrowserContext, Cookie } from "playwright"
import { createCookieIfDoesntExist } from "../src/common/util"
import { hash } from "../src/node/util"

describe("login", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async (done) => {
    browser = await chromium.launch()
    // Create a new context with the saved storage state
    const storageState = JSON.parse(process.env.STORAGE || "")

    //
    const cookieToStore = {
      sameSite: "Lax" as const,
      name: "key",
      value: hash(process.env.PASSWORD || ""),
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
    }

    // For some odd reason, the login method used in globalSetup.ts doesn't always work
    // I don't know if it's on playwright clearing our cookies by accident
    // or if it's our cookies disappearing.
    // This means we need an additional check to make sure we're logged in.
    // We do this by manually adding the cookie to the browser environment
    // if it's not there at the time the test starts
    const cookies: Cookie[] = storageState.cookies || []
    // If the cookie exists in cookies then
    // this will return the cookies with no changes
    // otherwise if it doesn't exist, it will create it
    // hence the name maybeUpdatedCookies
    const maybeUpdatedCookies = createCookieIfDoesntExist(cookies, cookieToStore)
    console.log("here are the cookies", maybeUpdatedCookies)

    context = await browser.newContext({
      storageState: { cookies: maybeUpdatedCookies },
      recordVideo: { dir: "./test/videos/" },
    })
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

  // NOTE: this test will fail if you do not run code-server with --home $CODE_SERVER_ADDRESS/healthz
  it("should see a 'Go Home' button in the Application Menu that goes to /healthz", async (done) => {
    // Ideally, this test should pass and finish before the timeout set in the Jest config
    // However, if it doesn't, we don't want a memory leak so we set this backup timeout
    // Otherwise Jest may throw this error
    // "Jest did not exit one second after the test run has completed.
    // This usually means that there are asynchronous operations that weren't stopped in your tests.
    // Consider running Jest with `--detectOpenHandles` to troubleshoot this issue."
    const backupTimeout = setTimeout(() => done(), 20000)

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
        clearTimeout(backupTimeout)

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
