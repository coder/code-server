import { chromium, Page, Browser } from "playwright"

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
  await page.goto("http://localhost:8080")
  // It should send us to the login page
  expect(await page.title()).toBe("code-server login")
})
