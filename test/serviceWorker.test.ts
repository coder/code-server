import makeServiceWorkerEnv = require("service-worker-mock")
const makeFetchMock = require("service-worker-mock/fetch")

describe("serviceWorker", () => {
  let spy: jest.SpyInstance
  beforeEach(() => {
    Object.assign(
      global,
      makeServiceWorkerEnv(),
      makeFetchMock(),
      // If you're using sinon ur similar you'd probably use below instead of makeFetchMock
      // fetch: sinon.stub().returns(Promise.resolve())
    )
    jest.resetModules()

    spy = jest.spyOn(console, "log")
  })

  afterEach(() => {
    jest.restoreAllMocks()
    spy.mockRestore()
  })

  it("should add listeners", () => {
    require("../src/browser/serviceWorker.ts")
    const _self = (self as unknown) as WorkerGlobalScope
    expect(_self.listeners.get("install")).toBeDefined()
    expect(_self.listeners.get("activate")).toBeDefined()
    expect(_self.listeners.get("fetch")).toBeDefined()
  })

  it("should call the proper callbacks for 'install'", async () => {
    require("../src/browser/serviceWorker.ts")
    await self.trigger("install")
    expect(spy).toHaveBeenCalledWith("[Service Worker] installed")
  })
  it("should call the proper callbacks for 'activate'", async () => {
    require("../src/browser/serviceWorker.ts")
    await self.trigger("activate")

    // Activate serviceWorker
    expect(spy).toHaveBeenCalledWith("[Service Worker] activated")
  })
})
