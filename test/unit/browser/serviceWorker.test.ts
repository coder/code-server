interface MockEvent {
  claim: jest.Mock<any, any>
  waitUntil?: jest.Mock<any, any>
}

interface Listener {
  event: string
  cb: (event?: MockEvent) => void
}

describe("serviceWorker", () => {
  let listeners: Listener[] = []
  let spy: jest.SpyInstance
  let claimSpy: jest.Mock<any, any>
  let waitUntilSpy: jest.Mock<any, any>

  function emit(event: string) {
    listeners
      .filter((listener) => listener.event === event)
      .forEach((listener) => {
        switch (event) {
          case "activate":
            listener.cb({
              claim: jest.fn(),
              waitUntil: jest.fn(() => waitUntilSpy()),
            })
            break
          default:
            listener.cb()
        }
      })
  }

  beforeEach(() => {
    claimSpy = jest.fn()
    spy = jest.spyOn(console, "log")
    waitUntilSpy = jest.fn()

    Object.assign(global, {
      self: global,
      addEventListener: (event: string, cb: () => void) => {
        listeners.push({ event, cb })
      },
      clients: {
        claim: claimSpy.mockResolvedValue("claimed"),
      },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()
    spy.mockClear()
    claimSpy.mockClear()

    // Clear all the listeners
    listeners = []
  })

  it("should add 3 listeners: install, activate and fetch", () => {
    require("../../../src/browser/serviceWorker.ts")
    const listenerEventNames = listeners.map((listener) => listener.event)

    expect(listeners).toHaveLength(3)
    expect(listenerEventNames).toContain("install")
    expect(listenerEventNames).toContain("activate")
    expect(listenerEventNames).toContain("fetch")
  })

  it("should call the proper callbacks for 'install'", async () => {
    require("../../../src/browser/serviceWorker.ts")
    emit("install")
    expect(spy).toHaveBeenCalledWith("[Service Worker] installed")
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should do nothing when 'fetch' is called", async () => {
    require("../../../src/browser/serviceWorker.ts")
    emit("fetch")
    expect(spy).not.toHaveBeenCalled()
  })

  it("should call the proper callbacks for 'activate'", async () => {
    require("../../../src/browser/serviceWorker.ts")
    emit("activate")

    // Activate serviceWorker
    expect(spy).toHaveBeenCalledWith("[Service Worker] activated")
    expect(waitUntilSpy).toHaveBeenCalled()
    expect(claimSpy).toHaveBeenCalled()
  })
})
