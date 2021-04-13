import { JSDOM } from "jsdom"
import { loggerModule } from "../utils/helpers"

describe("register", () => {
  describe("when navigator and serviceWorker are defined", () => {
    const mockRegisterFn = jest.fn()

    beforeAll(() => {
      const { window } = new JSDOM()
      global.window = (window as unknown) as Window & typeof globalThis
      global.document = window.document
      global.navigator = window.navigator
      global.location = window.location

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

      // We don't want these to stay around because it can affect other tests
      global.window = (undefined as unknown) as Window & typeof globalThis
      global.document = (undefined as unknown) as Document & typeof globalThis
      global.navigator = (undefined as unknown) as Navigator & typeof globalThis
      global.location = (undefined as unknown) as Location & typeof globalThis
    })

    it("should register a ServiceWorker", () => {
      // Load service worker like you would in the browser
      require("../../src/browser/register")
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
      require("../../src/browser/register")

      expect(mockRegisterFn).toHaveBeenCalled()
      expect(loggerModule.logger.error).toHaveBeenCalled()
      expect(loggerModule.logger.error).toHaveBeenCalledTimes(1)
      expect(loggerModule.logger.error).toHaveBeenCalledWith(
        `[Service Worker] registration: ${error.message} ${error.stack}`,
      )
    })
  })

  describe("when navigator and serviceWorker are NOT defined", () => {
    let spy: jest.SpyInstance

    beforeEach(() => {
      spy = jest.spyOn(console, "error")
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it("should log an error to the console", () => {
      // Load service worker like you would in the browser
      require("../../src/browser/register")
      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith("[Service Worker] navigator is undefined")
    })
  })
})
