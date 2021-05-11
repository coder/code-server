import { JSDOM } from "jsdom"
import { registerServiceWorker } from "../../src/browser/register"
import { createLoggerMock } from "../utils/helpers"
import { LocationLike } from "./util.test"

describe("register", () => {
  describe("when navigator and serviceWorker are defined", () => {
    const mockRegisterFn = jest.fn()

    beforeAll(() => {
      const { window } = new JSDOM()
      global.window = window as unknown as Window & typeof globalThis
      global.document = window.document
      global.navigator = window.navigator
      global.location = window.location

      Object.defineProperty(global.navigator, "serviceWorker", {
        value: {
          register: mockRegisterFn,
        },
      })
    })

    const loggerModule = createLoggerMock()
    beforeEach(() => {
      jest.clearAllMocks()
      jest.mock("@coder/logger", () => loggerModule)
    })

    afterEach(() => {
      jest.resetModules()
    })

    afterAll(() => {
      jest.restoreAllMocks()

      // We don't want these to stay around because it can affect other tests
      global.window = undefined as unknown as Window & typeof globalThis
      global.document = undefined as unknown as Document & typeof globalThis
      global.navigator = undefined as unknown as Navigator & typeof globalThis
      global.location = undefined as unknown as Location & typeof globalThis
    })

    it("test should have access to browser globals from beforeAll", () => {
      expect(typeof global.window).not.toBeFalsy()
      expect(typeof global.document).not.toBeFalsy()
      expect(typeof global.navigator).not.toBeFalsy()
      expect(typeof global.location).not.toBeFalsy()
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
    const loggerModule = createLoggerMock()
    beforeEach(() => {
      jest.clearAllMocks()
      jest.mock("@coder/logger", () => loggerModule)
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it("should log an error", () => {
      // Load service worker like you would in the browser
      require("../../src/browser/register")
      expect(loggerModule.logger.error).toHaveBeenCalled()
      expect(loggerModule.logger.error).toHaveBeenCalledTimes(1)
      expect(loggerModule.logger.error).toHaveBeenCalledWith("[Service Worker] navigator is undefined")
    })
  })

  describe("registerServiceWorker", () => {
    let serviceWorkerPath: string
    let serviceWorkerScope: string
    const mockFn = jest.fn((path: string, options: { scope: string }) => {
      serviceWorkerPath = path
      serviceWorkerScope = options.scope
      return undefined
    })

    beforeAll(() => {
      const location: LocationLike = {
        pathname: "",
        origin: "http://localhost:8080",
      }
      const { window } = new JSDOM()
      global.window = window as unknown as Window & typeof globalThis
      global.document = window.document
      global.navigator = window.navigator
      global.location = location as Location

      Object.defineProperty(global.navigator, "serviceWorker", {
        value: {
          register: mockFn,
        },
      })
    })

    afterEach(() => {
      mockFn.mockClear()
      jest.resetModules()
    })

    afterAll(() => {
      jest.restoreAllMocks()

      // We don't want these to stay around because it can affect other tests
      global.window = undefined as unknown as Window & typeof globalThis
      global.document = undefined as unknown as Document & typeof globalThis
      global.navigator = undefined as unknown as Navigator & typeof globalThis
      global.location = undefined as unknown as Location & typeof globalThis
    })
    it("should register when options.base is undefined", async () => {
      // Mock getElementById
      const csStaticBasePath = "/static/development/Users/jp/Dev/code-server"
      const spy = jest.spyOn(document, "getElementById")
      // Create a fake element and set the attribute
      const mockElement = document.createElement("div")
      mockElement.id = "coder-options"
      mockElement.setAttribute(
        "data-settings",
        `{"csStaticBase":"${csStaticBasePath}","logLevel":2,"disableTelemetry":false,"disableUpdateCheck":false}`,
      )
      // Return mockElement from the spy
      // this way, when we call "getElementById"
      // it returns the element
      spy.mockImplementation(() => mockElement)

      await registerServiceWorker()

      expect(mockFn).toBeCalled()
      expect(serviceWorkerPath).toMatch(`${csStaticBasePath}/dist/serviceWorker.js`)
      expect(serviceWorkerScope).toMatch("/")
    })
    it("should register when options.base is defined", async () => {
      const csStaticBasePath = "/static/development/Users/jp/Dev/code-server"
      const spy = jest.spyOn(document, "getElementById")
      // Create a fake element and set the attribute
      const mockElement = document.createElement("div")
      mockElement.id = "coder-options"
      mockElement.setAttribute(
        "data-settings",
        `{"base":"proxy/","csStaticBase":"${csStaticBasePath}","logLevel":2,"disableTelemetry":false,"disableUpdateCheck":false}`,
      )
      // Return mockElement from the spy
      // this way, when we call "getElementById"
      // it returns the element
      spy.mockImplementation(() => mockElement)

      await registerServiceWorker()

      expect(mockFn).toBeCalled()
      expect(serviceWorkerPath).toMatch(`/dist/serviceWorker.js`)
      expect(serviceWorkerScope).toMatch("/")
    })
  })
})
