import { chromium, Page, Browser, BrowserContext, Cookie } from "playwright"
import { hash } from "../src/node/util"
import { CODE_SERVER_ADDRESS, PASSWORD, STORAGE } from "./constants"
import { createCookieIfDoesntExist } from "./helpers"

describe("go home", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async () => {
    browser = await chromium.launch()
    // Create a new context with the saved storage state
    const storageState = JSON.parse(STORAGE) || {}

    const cookieToStore = {
      sameSite: "Lax" as const,
      name: "key",
      value: hash(PASSWORD),
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
    //
    // TODO(@jsjoeio)
    // The playwright storage thing sometimes works and sometimes doesn't. We should investigate this further
    // at some point.
    // See discussion: https://github.com/cdr/code-server/pull/2648#discussion_r575434946

    const maybeUpdatedCookies = createCookieIfDoesntExist(cookies, cookieToStore)

    context = await browser.newContext({
      storageState: { cookies: maybeUpdatedCookies },
      recordVideo: { dir: "./test/videos/" },
    })
  })

  afterAll(async () => {
    // Remove password from local storage
    await context.clearCookies()

    await context.close()
    await browser.close()
  })

  beforeEach(async () => {
    page = await context.newPage()
  })

  // NOTE: this test will fail if you do not run code-server with --home $CODE_SERVER_ADDRESS/healthz
  it("should see a 'Go Home' button in the Application Menu that goes to /healthz", async () => {
    const GO_HOME_URL = `${CODE_SERVER_ADDRESS}/healthz`
    // Sometimes a dialog shows up when you navigate
    // asking if you're sure you want to leave
    // so we listen if it comes, we accept it
    page.on("dialog", (dialog) => dialog.accept())

    // waitUntil: "domcontentloaded"
    // In case the page takes a long time to load
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "domcontentloaded" })

    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))

    // Click the Home menu
    await page.click("[aria-label='Application Menu']")
    // See the Go Home button
    const goHomeButton = "a.action-menu-item span[aria-label='Go Home']"
    expect(await page.isVisible(goHomeButton))

    // Click it and navigate to /healthz
    // NOTE: ran into issues of it failing intermittently
    // without having button: "middle"
    await Promise.all([page.waitForNavigation(), page.click(goHomeButton, { button: "middle" })])
    expect(page.url()).toBe(GO_HOME_URL)
  })
})
