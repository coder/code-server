import { shouldEnableProxy } from "../../../src/node/proxy_agent"

/**
 * Helper function to set an env variable.
 *
 * Returns a function to cleanup the env variable.
 */
function setEnv(name: string, value: string) {
  process.env[name] = value

  return {
    cleanup() {
      delete process.env[name]
    },
  }
}

describe("shouldEnableProxy", () => {
  // Source: https://stackoverflow.com/a/48042799
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
    process.env = { ...OLD_ENV } // Make a copy
  })

  afterAll(() => {
    process.env = OLD_ENV // Restore old environment
  })

  it("returns true when HTTP_PROXY is set", () => {
    const { cleanup } = setEnv("HTTP_PROXY", "http://proxy.example.com")
    expect(shouldEnableProxy()).toBe(true)
    cleanup()
  })
  it("returns true when HTTPS_PROXY is set", () => {
    const { cleanup } = setEnv("HTTPS_PROXY", "http://proxy.example.com")
    expect(shouldEnableProxy()).toBe(true)
    cleanup()
  })
  it("returns false when NO_PROXY is set", () => {
    const { cleanup } = setEnv("NO_PROXY", "*")
    expect(shouldEnableProxy()).toBe(false)
    cleanup()
  })
  it("should return false when neither HTTP_PROXY nor HTTPS_PROXY is set", () => {
    expect(shouldEnableProxy()).toBe(false)
  })
  it("should return false when NO_PROXY is set to https://example.com", () => {
    const { cleanup } = setEnv("NO_PROXY", "https://example.com")
    expect(shouldEnableProxy()).toBe(false)
    cleanup()
  })
  it("should return false when NO_PROXY is set to http://example.com", () => {
    const { cleanup } = setEnv("NO_PROXY", "http://example.com")
    expect(shouldEnableProxy()).toBe(false)
    cleanup()
  })
})
