import { shouldEnableProxy } from "../../../src/node/proxy_agent"
import { useEnv } from "../../utils/helpers"

describe("shouldEnableProxy", () => {
  const [setHTTPProxy, resetHTTPProxy] = useEnv("HTTP_PROXY")
  const [setHTTPSProxy, resetHTTPSProxy] = useEnv("HTTPS_PROXY")
  const [setNoProxy, resetNoProxy] = useEnv("NO_PROXY")

  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
    resetHTTPProxy()
    resetNoProxy()
    resetHTTPSProxy()
  })

  it("returns true when HTTP_PROXY is set", () => {
    setHTTPProxy("http://proxy.example.com")
    expect(shouldEnableProxy()).toBe(true)
  })
  it("returns true when HTTPS_PROXY is set", () => {
    setHTTPSProxy("https://proxy.example.com")
    expect(shouldEnableProxy()).toBe(true)
  })
  it("returns false when NO_PROXY is set", () => {
    setNoProxy("*")
    expect(shouldEnableProxy()).toBe(false)
  })
  it("should return false when neither HTTP_PROXY nor HTTPS_PROXY is set", () => {
    expect(shouldEnableProxy()).toBe(false)
  })
  it("should return false when NO_PROXY is set to https://example.com", () => {
    setNoProxy("https://example.com")
    expect(shouldEnableProxy()).toBe(false)
  })
  it("should return false when NO_PROXY is set to http://example.com", () => {
    setNoProxy("http://example.com")
    expect(shouldEnableProxy()).toBe(false)
  })
})
