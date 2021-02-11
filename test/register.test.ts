import { JSDOM } from "jsdom"
import { registerServiceWorker } from "../src/browser/register"
const { window } = new JSDOM()
global.window = (window as unknown) as Window & typeof globalThis
global.document = window.document
global.navigator = window.navigator

describe("register", () => {
  const spy = jest.fn()
  beforeAll(() => {
    // register relies on navigator to be defined globally
    // this is because the code is called on the browser
    // so we're sure it will be defined
    // We have to cast/assert so that TS thinks it's the correct type
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        register: spy,
      },
    })
    // global.navigator.serviceWorker.register = (spy as unknown) as ServiceWorkerContainer["register"]
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })
  it("should register a ServiceWorker", () => {
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
})
