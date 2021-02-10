import { Emitter } from "../src/common/emitter"

describe("emitter", () => {
  describe("Emitter", () => {
    it("should return an Emitter", async () => {
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
      emitter.event(onHelloWorld)
      emitter.event(onGoodbyeWorld)

      await emitter.emit({ event: HELLO_WORLD, callback: mockCallback })

      // Double-check that our callback is called only once
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback).toHaveBeenCalledTimes(1)

      await emitter.emit({ event: GOODBYE_WORLD, callback: mockSecondCallback })

      // Check that it works with multiple listeners
      expect(mockSecondCallback).toHaveBeenCalled()
      expect(mockSecondCallback).toHaveBeenCalledTimes(1)

      // Dispose of all the listeners
      emitter.dispose()
    })

    it.skip("should log an error if something goes wrong", () => {
      // not sure how we're going to test this
      // need to mock logger
      // and then somehow throw or something in the callback
    })
  })
})
