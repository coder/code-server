// Note: we need to import logger from the root
// because this is the logger used in logError in ../src/common/util
import { logger } from "@coder/logger"

import { Emitter } from "../../../src/common/emitter"

describe("emitter", () => {
  let spy: jest.SpyInstance

  beforeEach(() => {
    spy = jest.spyOn(logger, "error")
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it("should run the correct callbacks", async () => {
    const HELLO_WORLD = "HELLO_WORLD"
    const GOODBYE_WORLD = "GOODBYE_WORLD"
    const mockCallback = jest.fn(() => "Mock function called")
    const mockSecondCallback = jest.fn(() => undefined)

    const emitter = new Emitter<{ event: string; callback: () => void }>()

    const onHelloWorld = ({ event, callback }: { event: string; callback: () => void }): void => {
      if (event === HELLO_WORLD) {
        callback()
      }
    }

    const onGoodbyeWorld = ({ event, callback }: { event: string; callback: () => void }): void => {
      if (event === GOODBYE_WORLD) {
        callback()
      }
    }

    // Register the onHelloWorld listener
    // and the onGoodbyeWorld
    const _onHelloWorld = emitter.event(onHelloWorld)
    emitter.event(onGoodbyeWorld)

    await emitter.emit({ event: HELLO_WORLD, callback: mockCallback })

    // Double-check that our callback is called only once
    expect(mockCallback).toHaveBeenCalled()
    expect(mockCallback).toHaveBeenCalledTimes(1)

    await emitter.emit({ event: GOODBYE_WORLD, callback: mockSecondCallback })

    // Check that it works with multiple listeners
    expect(mockSecondCallback).toHaveBeenCalled()
    expect(mockSecondCallback).toHaveBeenCalledTimes(1)

    // Dispose of individual listener
    _onHelloWorld.dispose()

    // Try disposing twice
    _onHelloWorld.dispose()

    // Dispose of all the listeners
    emitter.dispose()
  })

  it("should log an error if something goes wrong", async () => {
    const HELLO_WORLD = "HELLO_WORLD"
    const mockCallback = jest.fn(() => "Mock function called")
    const message = "You don't have access to that folder."

    const emitter = new Emitter<{ event: string; callback: () => void }>()

    const onHelloWorld = ({ event, callback }: { event: string; callback: () => void }): void => {
      if (event === HELLO_WORLD) {
        callback()
        throw new Error(message)
      }
    }

    emitter.event(onHelloWorld)

    await emitter.emit({ event: HELLO_WORLD, callback: mockCallback })

    // Check that error was called
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(message)
  })
})
