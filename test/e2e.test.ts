import { chromium, Page, Browser } from "playwright"
import { CODE_SERVER_ADDRESS } from "./constants"

let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await chromium.launch()
})
afterAll(async () => {
  await browser.close()
})
beforeEach(async () => {
  page = await browser.newPage()
})
afterEach(async () => {
  await page.close()
})

it("should see the login page", async () => {
  await page.goto(CODE_SERVER_ADDRESS)
  // It should send us to the login page
  expect(await page.title()).toBe("code-server login")
})
