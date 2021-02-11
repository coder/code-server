import { JSDOM } from "jsdom"
// Note: we need to import logger from the root
// because this is the logger used in logError in ../src/common/util
import { logger } from "../node_modules/@coder/logger"
import { registerServiceWorker } from "../src/browser/register"
const { window } = new JSDOM()
global.window = (window as unknown) as Window & typeof globalThis
global.document = window.document
global.navigator = window.navigator

describe("register", () => {
  describe("registerServiceWorker", () => {
    const spy = jest.fn()
    let loggerSpy: jest.SpyInstance

    beforeAll(() => {
      Object.defineProperty(global.navigator, "serviceWorker", {
        value: {
          register: () => {
            return "hello"
          },
        },
      })
    })

    beforeEach(() => {
      loggerSpy = jest.spyOn(logger, "error")
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it("should register a ServiceWorker", () => {
      global.navigator.serviceWorker.register = spy
      // call registerServiceWorker
      const path = "/hello"
      const mockOptions = {
        base: "",
        csStaticBase: "",
        logLevel: 0,
      }
      registerServiceWorker(navigator, path, mockOptions)
      // expect spy to have been called
      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("should log an error if something goes work", () => {
      const message = "Can't find browser"
      const path = "/hello"
      const mockOptions = {
        base: "",
        csStaticBase: "",
        logLevel: 0,
      }
      global.navigator.serviceWorker.register = () => {
        throw new Error(message)
      }

      registerServiceWorker(navigator, path, mockOptions)
      expect(loggerSpy).toHaveBeenCalled()
      expect(loggerSpy).toHaveBeenCalledTimes(1)
      expect(loggerSpy).toHaveBeenCalledWith(`[Service Worker] failed to register: ${message}`)
    })
  })
})
