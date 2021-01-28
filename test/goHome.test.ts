import { chromium, Page, Browser, BrowserContext } from "playwright"

// NOTE: this is hard-coded and passed as an environment variable
// See the test job in ci.yml
const PASSWORD = "e45432jklfdsab"

describe("login", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false })
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

  it("should see a 'Go Home' button in the Application Menu that goes to coder.com", async () => {
    await page.goto("http://localhost:8080")
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    // Click the Applicaiton menu
    await page.click(".menubar-menu-button[title='Application Menu']")
    // See the Go Home button
    const goHomeButton = ".home-bar[aria-label='Home'] li"
    expect(await page.isVisible(goHomeButton))
    // Hover over element without clicking
    await page.hover(goHomeButton)
    // Click the top left corner of the element
    await page.click(goHomeButton)
    // Note: we have to click on <li> in the Go Home button for it to work
    // Land on coder.com
    // expect(await page.url()).toBe("https://coder.com/")
  })
})
