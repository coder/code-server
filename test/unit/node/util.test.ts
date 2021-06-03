import {
  hash,
  isHashMatch,
  handlePasswordValidation,
  PasswordMethod,
  getPasswordMethod,
  hashLegacy,
  isHashLegacyMatch,
  isCookieValid,
} from "../../../src/node/util"

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
  it("should return a hash of the string passed in", async () => {
    const plainTextPassword = "mySecretPassword123"
    const hashed = await hash(plainTextPassword)
    expect(hashed).not.toBe(plainTextPassword)
  })
})

describe("isHashMatch", () => {
  it("should return true if the password matches the hash", async () => {
    const password = "codeserver1234"
    const _hash = await hash(password)
    const actual = await isHashMatch(password, _hash)
    expect(actual).toBe(true)
  })
  it("should return false if the password does not match the hash", async () => {
    const password = "password123"
    const _hash = await hash(password)
    const actual = await isHashMatch("otherPassword123", _hash)
    expect(actual).toBe(false)
  })
  it("should return true with actual hash", async () => {
    const password = "password123"
    const _hash = "$argon2i$v=19$m=4096,t=3,p=1$EAoczTxVki21JDfIZpTUxg$rkXgyrW4RDGoDYrxBFD4H2DlSMEhP4h+Api1hXnGnFY"
    const actual = await isHashMatch(password, _hash)
    expect(actual).toBe(true)
  })
})

describe("hashLegacy", () => {
  it("should return a hash of the string passed in", () => {
    const plainTextPassword = "mySecretPassword123"
    const hashed = hashLegacy(plainTextPassword)
    expect(hashed).not.toBe(plainTextPassword)
  })
})

describe("isHashLegacyMatch", () => {
  it("should return true if is match", () => {
    const password = "password123"
    const _hash = hashLegacy(password)
    expect(isHashLegacyMatch(password, _hash)).toBe(true)
  })
  it("should return false if is match", () => {
    const password = "password123"
    const _hash = hashLegacy(password)
    expect(isHashLegacyMatch("otherPassword123", _hash)).toBe(false)
  })
  it("should return true if hashed from command line", () => {
    const password = "password123"
    // Hashed using printf "password123" | sha256sum | cut -d' ' -f1
    const _hash = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
    expect(isHashLegacyMatch(password, _hash)).toBe(true)
  })
})

describe("getPasswordMethod", () => {
  it("should return PLAIN_TEXT for no hashed password", () => {
    const hashedPassword = undefined
    const passwordMethod = getPasswordMethod(hashedPassword)
    const expected: PasswordMethod = "PLAIN_TEXT"
    expect(passwordMethod).toEqual(expected)
  })
  it("should return ARGON2 for password with 'argon2'", () => {
    const hashedPassword =
      "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY"
    const passwordMethod = getPasswordMethod(hashedPassword)
    const expected: PasswordMethod = "ARGON2"
    expect(passwordMethod).toEqual(expected)
  })
  it("should return SHA256 for password with legacy hash", () => {
    const hashedPassword = "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af"
    const passwordMethod = getPasswordMethod(hashedPassword)
    const expected: PasswordMethod = "SHA256"
    expect(passwordMethod).toEqual(expected)
  })
})

describe("handlePasswordValidation", () => {
  it("should return true with a hashedPassword for a PLAIN_TEXT password", async () => {
    const p = "password"
    const passwordValidation = await handlePasswordValidation({
      passwordMethod: "PLAIN_TEXT",
      passwordFromRequestBody: p,
      passwordFromArgs: p,
      hashedPasswordFromArgs: undefined,
    })

    const matchesHash = await isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(true)
    expect(matchesHash).toBe(true)
  })
  it("should return false when PLAIN_TEXT password doesn't match args", async () => {
    const p = "password"
    const passwordValidation = await handlePasswordValidation({
      passwordMethod: "PLAIN_TEXT",
      passwordFromRequestBody: "password1",
      passwordFromArgs: p,
      hashedPasswordFromArgs: undefined,
    })

    const matchesHash = await isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(false)
    expect(matchesHash).toBe(false)
  })
  it("should return true with a hashedPassword for a SHA256 password", async () => {
    const p = "helloworld"
    const passwordValidation = await handlePasswordValidation({
      passwordMethod: "SHA256",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
    })

    const matchesHash = isHashLegacyMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(true)
    expect(matchesHash).toBe(true)
  })
  it("should return false when SHA256 password doesn't match hash", async () => {
    const p = "helloworld1"
    const passwordValidation = await handlePasswordValidation({
      passwordMethod: "SHA256",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
    })

    const matchesHash = isHashLegacyMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(false)
    expect(matchesHash).toBe(false)
  })
  it("should return true with a hashedPassword for a ARGON2 password", async () => {
    const p = "password"
    const passwordValidation = await handlePasswordValidation({
      passwordMethod: "ARGON2",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
    })

    const matchesHash = await isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(true)
    expect(matchesHash).toBe(true)
  })
  it("should return false when ARGON2 password doesn't match hash", async () => {
    const p = "password1"
    const passwordValidation = await handlePasswordValidation({
      passwordMethod: "ARGON2",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
    })

    const matchesHash = await isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(false)
    expect(matchesHash).toBe(false)
  })
})

describe.only("isCookieValid", () => {
  it("should be valid if hashed-password for SHA256 matches cookie.key", async () => {
    const isValid = await isCookieValid({
      passwordMethod: "SHA256",
      cookieKey: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(true)
  })
  it("should be invalid if hashed-password for SHA256 does not match cookie.key", async () => {
    const isValid = await isCookieValid({
      passwordMethod: "SHA256",
      cookieKey: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb9442bb6f8f8f07af",
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(false)
  })
  it("should be valid if hashed-password for ARGON2 matches cookie.key", async () => {
    const isValid = await isCookieValid({
      passwordMethod: "ARGON2",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(true)
  })
  it("should be invalid if hashed-password for ARGON2 does not match cookie.key", async () => {
    const isValid = await isCookieValid({
      passwordMethod: "ARGON2",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9H",
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(false)
  })
  it("should be valid if password for PLAIN_TEXT matches cookie.key", async () => {
    const isValid = await isCookieValid({
      passwordMethod: "PLAIN_TEXT",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      passwordFromArgs: "password",
      hashedPasswordFromArgs: undefined,
    })
    expect(isValid).toBe(true)
  })
  it("should be invalid if hashed-password for PLAIN_TEXT does not match cookie.key", async () => {
    const isValid = await isCookieValid({
      passwordMethod: "PLAIN_TEXT",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9H",
      passwordFromArgs: "password1234",
      hashedPasswordFromArgs: undefined,
    })
    expect(isValid).toBe(false)
  })
})
