import { JSDOM } from "jsdom"
import { loggerModule } from "./helpers"

describe("register", () => {
  const { window } = new JSDOM()
  global.window = (window as unknown) as Window & typeof globalThis
  global.document = window.document
  global.navigator = window.navigator
  global.location = window.location

  const mockRegisterFn = jest.fn()

  beforeAll(() => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        register: mockRegisterFn,
      },
    })
  })

  beforeEach(() => {
    jest.mock("@coder/logger", () => loggerModule)
  })

  afterEach(() => {
    mockRegisterFn.mockClear()
    jest.resetModules()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it("should register a ServiceWorker", () => {
    // Load service worker like you would in the browser
    require("../src/browser/register")
    // Load service worker like you would in the browser
    expect(mockRegisterFn).toHaveBeenCalled()
    expect(mockRegisterFn).toHaveBeenCalledTimes(1)
  })

  it("should log an error if something doesn't work", () => {
    const message = "Can't find browser"
    const error = new Error(message)

    mockRegisterFn.mockImplementation(() => {
      throw error
    })

    // Load service worker like you would in the browser
    require("../src/browser/register")

    expect(mockRegisterFn).toHaveBeenCalled()
    expect(loggerModule.logger.error).toHaveBeenCalled()
    expect(loggerModule.logger.error).toHaveBeenCalledTimes(1)
    expect(loggerModule.logger.error).toHaveBeenCalledWith(
      `[Service Worker] registration: ${error.message} ${error.stack}`,
    )
  })
})
