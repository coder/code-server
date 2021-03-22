import { chromium, Page, Browser, BrowserContext, Cookie } from "playwright"
import { hash } from "../../src/node/util"
import { CODE_SERVER_ADDRESS, PASSWORD, STORAGE, E2E_VIDEO_DIR } from "../utils/constants"
import { createCookieIfDoesntExist } from "../utils/helpers"

describe("Open Help > About", () => {
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
      recordVideo: { dir: E2E_VIDEO_DIR },
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

  it("should see a 'Help' then 'About' button in the Application Menu that opens a dialog", async () => {
    // waitUntil: "domcontentloaded"
    // In case the page takes a long time to load
    await page.goto(CODE_SERVER_ADDRESS, { waitUntil: "domcontentloaded" })

    // Make sure the editor actually loaded
    expect(await page.isVisible("div.monaco-workbench"))

    // Click the Application menu
    await page.click("[aria-label='Application Menu']")
    // See the Help button
    const helpButton = "a.action-menu-item span[aria-label='Help']"
    expect(await page.isVisible(helpButton))

    // Hover the helpButton
    await page.hover(helpButton)

    // see the About button and click it
    const aboutButton = "a.action-menu-item span[aria-label='About']"
    expect(await page.isVisible(aboutButton))
    // NOTE: it won't work unless you hover it first
    await page.hover(aboutButton)
    await page.click(aboutButton)

    const codeServerText = "text=code-server"
    expect(await page.isVisible(codeServerText))
  })
})
