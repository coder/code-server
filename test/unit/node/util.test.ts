import { hash } from "../../../src/node/util"

describe("getEnvPaths", () => {
  describe("on darwin", () => {
    let ORIGINAL_PLATFORM = ""

    beforeAll(() => {
      ORIGINAL_PLATFORM = process.platform

      Object.defineProperty(process, "platform", {
        value: "darwin",
      })
    })

    beforeEach(() => {
      jest.resetModules()
      jest.mock("env-paths", () => {
        return () => ({
          data: "/home/envPath/.local/share",
          config: "/home/envPath/.config",
          temp: "/tmp/envPath/runtime",
        })
      })
    })

    afterAll(() => {
      // Restore old platform

      Object.defineProperty(process, "platform", {
        value: ORIGINAL_PLATFORM,
      })
    })

    it("should return the env paths using xdgBasedir", () => {
      jest.mock("xdg-basedir", () => ({
        data: "/home/usr/.local/share",
        config: "/home/usr/.config",
        runtime: "/tmp/runtime",
      }))
      const getEnvPaths = require("../../../src/node/util").getEnvPaths
      const envPaths = getEnvPaths()

      expect(envPaths.data).toEqual("/home/usr/.local/share/code-server")
      expect(envPaths.config).toEqual("/home/usr/.config/code-server")
      expect(envPaths.runtime).toEqual("/tmp/runtime/code-server")
    })

    it("should return the env paths using envPaths when xdgBasedir is undefined", () => {
      jest.mock("xdg-basedir", () => ({}))
      const getEnvPaths = require("../../../src/node/util").getEnvPaths
      const envPaths = getEnvPaths()

      expect(envPaths.data).toEqual("/home/envPath/.local/share")
      expect(envPaths.config).toEqual("/home/envPath/.config")
      expect(envPaths.runtime).toEqual("/tmp/envPath/runtime")
    })
  })
  describe("on win32", () => {
    let ORIGINAL_PLATFORM = ""

    beforeAll(() => {
      ORIGINAL_PLATFORM = process.platform

      Object.defineProperty(process, "platform", {
        value: "win32",
      })
    })

    beforeEach(() => {
      jest.resetModules()
      jest.mock("env-paths", () => {
        return () => ({
          data: "/windows/envPath/.local/share",
          config: "/windows/envPath/.config",
          temp: "/tmp/envPath/runtime",
        })
      })
    })

    afterAll(() => {
      // Restore old platform

      Object.defineProperty(process, "platform", {
        value: ORIGINAL_PLATFORM,
      })
    })

    it("should return the env paths using envPaths", () => {
      const getEnvPaths = require("../../../src/node/util").getEnvPaths
      const envPaths = getEnvPaths()

      expect(envPaths.data).toEqual("/windows/envPath/.local/share")
      expect(envPaths.config).toEqual("/windows/envPath/.config")
      expect(envPaths.runtime).toEqual("/tmp/envPath/runtime")
    })
  })
  describe("on other platforms", () => {
    let ORIGINAL_PLATFORM = ""

    beforeAll(() => {
      ORIGINAL_PLATFORM = process.platform

      Object.defineProperty(process, "platform", {
        value: "linux",
      })
    })

    beforeEach(() => {
      jest.resetModules()
      jest.mock("env-paths", () => {
        return () => ({
          data: "/linux/envPath/.local/share",
          config: "/linux/envPath/.config",
          temp: "/tmp/envPath/runtime",
        })
      })
    })

    afterAll(() => {
      // Restore old platform

      Object.defineProperty(process, "platform", {
        value: ORIGINAL_PLATFORM,
      })
    })

    it("should return the runtime using xdgBasedir if it exists", () => {
      jest.mock("xdg-basedir", () => ({
        runtime: "/tmp/runtime",
      }))
      const getEnvPaths = require("../../../src/node/util").getEnvPaths
      const envPaths = getEnvPaths()

      expect(envPaths.data).toEqual("/linux/envPath/.local/share")
      expect(envPaths.config).toEqual("/linux/envPath/.config")
      expect(envPaths.runtime).toEqual("/tmp/runtime/code-server")
    })

    it("should return the env paths using envPaths when xdgBasedir is undefined", () => {
      jest.mock("xdg-basedir", () => ({}))
      const getEnvPaths = require("../../../src/node/util").getEnvPaths
      const envPaths = getEnvPaths()

      expect(envPaths.data).toEqual("/linux/envPath/.local/share")
      expect(envPaths.config).toEqual("/linux/envPath/.config")
      expect(envPaths.runtime).toEqual("/tmp/envPath/runtime")
    })
  })
})

describe("hash", () => {
  it("should return a hash of the string passed in", () => {
    const plainTextPassword = "mySecretPassword123"
    const hashed = hash(plainTextPassword)
    expect(hashed).not.toBe(plainTextPassword)
  })
})
