import { JSDOM } from "jsdom"
// Note: we need to import logger from the root
// because this is the logger used in logError in ../src/common/util
import { logger } from "../node_modules/@coder/logger"
import { registerServiceWorker, handleServiceWorkerRegistration } from "../src/browser/register"
import { Options } from "../src/common/util"
const { window } = new JSDOM()
global.window = (window as unknown) as Window & typeof globalThis
global.document = window.document
global.navigator = window.navigator

describe("register", () => {
  describe("registerServiceWorker", () => {
    let spy: jest.MockedFunction<(
      scriptURL: string,
      options?: RegistrationOptions | undefined,
    ) => Promise<ServiceWorkerRegistration>>
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
      spy = jest.fn()
      global.navigator.serviceWorker.register = spy
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it("should register a ServiceWorker", () => {
      global.navigator.serviceWorker.register = spy
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

    it("should log an error if something doesn't work", () => {
      const message = "Can't find browser"
      const error = new Error(message)
      const path = "/hello"
      const mockOptions = {
        base: "",
        csStaticBase: "",
        logLevel: 0,
      }
      global.navigator.serviceWorker.register = () => {
        throw error
      }

      registerServiceWorker(navigator, path, mockOptions)
      expect(loggerSpy).toHaveBeenCalled()
      expect(loggerSpy).toHaveBeenCalledTimes(1)
      // Because we use logError, it will log the prefix along with the error message
      expect(loggerSpy).toHaveBeenCalledWith(`[Service Worker] registration: ${error.message} ${error.stack}`)
    })

    it("should work when base is undefined", () => {
      const path = "/hello"

      // We want to test some code that checks if options.base is undefined
      // so we leave it off mockOptions
      // but assert it as Options so TS is happy
      const mockOptions = {
        csStaticBase: "",
        logLevel: 0,
      } as Options
      registerServiceWorker(navigator, path, mockOptions)
      // expect spy to have been called
      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe("handleServiceWorkerRegistration", () => {
    let getOptionsMock: jest.MockedFunction<() => {
      base: string
      csStaticBase: string
      logLevel: number
    }>
    let normalizeMock: jest.MockedFunction<(v: string) => string>
    let registerServiceWorkerMock: jest.MockedFunction<(
      navigator: Navigator,
      path: string,
      mockOptions: Options,
    ) => Promise<void>>

    beforeEach(() => {
      getOptionsMock = jest.fn(() => ({
        base: "",
        csStaticBase: "",
        logLevel: 0,
      }))

      normalizeMock = jest.fn((url: string) => "qux///")

      registerServiceWorkerMock = jest
        .fn()
        .mockImplementation((navigator: Navigator, path: string, mockOptions: Options) => Promise.resolve())
    })
    it("should work when called", () => {
      handleServiceWorkerRegistration({
        getOptions: getOptionsMock,
        normalize: normalizeMock,
        registerServiceWorker: registerServiceWorkerMock,
      })

      const mocks = [getOptionsMock, normalizeMock, registerServiceWorkerMock]

      mocks.forEach((mock) => {
        expect(mock).toHaveBeenCalled()
        expect(mock).toHaveBeenCalledTimes(1)
      })
    })
  })
})
