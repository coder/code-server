import * as cp from "child_process"
import { promises as fs } from "fs"
import * as path from "path"
import { generateUuid } from "../../../src/common/util"
import { tmpdir } from "../../../src/node/constants"
import * as util from "../../../src/node/util"

describe.skip("getEnvPaths", () => {
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
    const hashed = await util.hash(plainTextPassword)
    expect(hashed).not.toBe(plainTextPassword)
  })
})

describe("isHashMatch", () => {
  it("should return true if the password matches the hash", async () => {
    const password = "codeserver1234"
    const _hash = await util.hash(password)
    const actual = await util.isHashMatch(password, _hash)
    expect(actual).toBe(true)
  })
  it("should return false if the password does not match the hash", async () => {
    const password = "password123"
    const _hash = await util.hash(password)
    const actual = await util.isHashMatch("otherPassword123", _hash)
    expect(actual).toBe(false)
  })
  it("should return true with actual hash", async () => {
    const password = "password123"
    const _hash = "$argon2i$v=19$m=4096,t=3,p=1$EAoczTxVki21JDfIZpTUxg$rkXgyrW4RDGoDYrxBFD4H2DlSMEhP4h+Api1hXnGnFY"
    const actual = await util.isHashMatch(password, _hash)
    expect(actual).toBe(true)
  })
  it("should return false if the password is empty", async () => {
    const password = ""
    const _hash = "$argon2i$v=19$m=4096,t=3,p=1$EAoczTxVki21JDfIZpTUxg$rkXgyrW4RDGoDYrxBFD4H2DlSMEhP4h+Api1hXnGnFY"
    const actual = await util.isHashMatch(password, _hash)
    expect(actual).toBe(false)
  })
  it("should return false if the hash is empty", async () => {
    const password = "hellowpasssword"
    const _hash = ""
    const actual = await util.isHashMatch(password, _hash)
    expect(actual).toBe(false)
  })
  it("should return false and not throw an error if the hash doesn't start with a $", async () => {
    const password = "hellowpasssword"
    const _hash = "n2i$v=19$m=4096,t=3,p=1$EAoczTxVki21JDfIZpTUxg$rkXgyrW4RDGoDYrxBFD4H2DlSMEhP4h+Api1hXnGnFY"
    expect(async () => await util.isHashMatch(password, _hash)).not.toThrow()
    expect(await util.isHashMatch(password, _hash)).toBe(false)
  })
  it("should return false if the password and hash don't match", async () => {
    const password = "hellowpasssword"
    const _hash = "$ar2i"
    const actual = await util.isHashMatch(password, _hash)
    expect(actual).toBe(false)
  })
})

describe("hashLegacy", () => {
  it("should return a hash of the string passed in", () => {
    const plainTextPassword = "mySecretPassword123"
    const hashed = util.hashLegacy(plainTextPassword)
    expect(hashed).not.toBe(plainTextPassword)
  })
})

describe("isHashLegacyMatch", () => {
  it("should return true if is match", () => {
    const password = "password123"
    const _hash = util.hashLegacy(password)
    expect(util.isHashLegacyMatch(password, _hash)).toBe(true)
  })
  it("should return false if is match", () => {
    const password = "password123"
    const _hash = util.hashLegacy(password)
    expect(util.isHashLegacyMatch("otherPassword123", _hash)).toBe(false)
  })
  it("should return true if hashed from command line", () => {
    const password = "password123"
    // Hashed using printf "password123" | sha256sum | cut -d' ' -f1
    const _hash = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
    expect(util.isHashLegacyMatch(password, _hash)).toBe(true)
  })
})

describe("getPasswordMethod", () => {
  it("should return PLAIN_TEXT for no hashed password", () => {
    const hashedPassword = undefined
    const passwordMethod = util.getPasswordMethod(hashedPassword)
    const expected: util.PasswordMethod = "PLAIN_TEXT"
    expect(passwordMethod).toEqual(expected)
  })
  it("should return ARGON2 for password with 'argon2'", () => {
    const hashedPassword =
      "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY"
    const passwordMethod = util.getPasswordMethod(hashedPassword)
    const expected: util.PasswordMethod = "ARGON2"
    expect(passwordMethod).toEqual(expected)
  })
  it("should return SHA256 for password with legacy hash", () => {
    const hashedPassword = "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af"
    const passwordMethod = util.getPasswordMethod(hashedPassword)
    const expected: util.PasswordMethod = "SHA256"
    expect(passwordMethod).toEqual(expected)
  })
})

describe("handlePasswordValidation", () => {
  it("should return true with a hashedPassword for a PLAIN_TEXT password", async () => {
    const p = "password"
    const passwordValidation = await util.handlePasswordValidation({
      passwordMethod: "PLAIN_TEXT",
      passwordFromRequestBody: p,
      passwordFromArgs: p,
      hashedPasswordFromArgs: undefined,
    })

    const matchesHash = await util.isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(true)
    expect(matchesHash).toBe(true)
  })
  it("should return false when PLAIN_TEXT password doesn't match args", async () => {
    const p = "password"
    const passwordValidation = await util.handlePasswordValidation({
      passwordMethod: "PLAIN_TEXT",
      passwordFromRequestBody: "password1",
      passwordFromArgs: p,
      hashedPasswordFromArgs: undefined,
    })

    const matchesHash = await util.isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(false)
    expect(matchesHash).toBe(false)
  })
  it("should return true with a hashedPassword for a SHA256 password", async () => {
    const p = "helloworld"
    const passwordValidation = await util.handlePasswordValidation({
      passwordMethod: "SHA256",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
    })

    const matchesHash = util.isHashLegacyMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(true)
    expect(matchesHash).toBe(true)
  })
  it("should return false when SHA256 password doesn't match hash", async () => {
    const p = "helloworld1"
    const passwordValidation = await util.handlePasswordValidation({
      passwordMethod: "SHA256",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
    })

    const matchesHash = util.isHashLegacyMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(false)
    expect(matchesHash).toBe(false)
  })
  it("should return true with a hashedPassword for a ARGON2 password", async () => {
    const p = "password"
    const passwordValidation = await util.handlePasswordValidation({
      passwordMethod: "ARGON2",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
    })

    const matchesHash = await util.isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(true)
    expect(matchesHash).toBe(true)
  })
  it("should return false when ARGON2 password doesn't match hash", async () => {
    const p = "password1"
    const passwordValidation = await util.handlePasswordValidation({
      passwordMethod: "ARGON2",
      passwordFromRequestBody: p,
      passwordFromArgs: undefined,
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
    })

    const matchesHash = await util.isHashMatch(p, passwordValidation.hashedPassword)

    expect(passwordValidation.isPasswordValid).toBe(false)
    expect(matchesHash).toBe(false)
  })
})

describe("isCookieValid", () => {
  it("should be valid if hashed-password for SHA256 matches cookie.key", async () => {
    const isValid = await util.isCookieValid({
      passwordMethod: "SHA256",
      cookieKey: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(true)
  })
  it("should be invalid if hashed-password for SHA256 does not match cookie.key", async () => {
    const isValid = await util.isCookieValid({
      passwordMethod: "SHA256",
      cookieKey: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb9442bb6f8f8f07af",
      hashedPasswordFromArgs: "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(false)
  })
  it("should be valid if hashed-password for ARGON2 matches cookie.key", async () => {
    const isValid = await util.isCookieValid({
      passwordMethod: "ARGON2",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(true)
  })
  it("should be invalid if hashed-password for ARGON2 does not match cookie.key", async () => {
    const isValid = await util.isCookieValid({
      passwordMethod: "ARGON2",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9H",
      hashedPasswordFromArgs:
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      passwordFromArgs: undefined,
    })
    expect(isValid).toBe(false)
  })
  it("should be valid if password for PLAIN_TEXT matches cookie.key", async () => {
    const isValid = await util.isCookieValid({
      passwordMethod: "PLAIN_TEXT",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      passwordFromArgs: "password",
      hashedPasswordFromArgs: undefined,
    })
    expect(isValid).toBe(true)
  })
  it("should be invalid if hashed-password for PLAIN_TEXT does not match cookie.key", async () => {
    const isValid = await util.isCookieValid({
      passwordMethod: "PLAIN_TEXT",
      cookieKey: "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9H",
      passwordFromArgs: "password1234",
      hashedPasswordFromArgs: undefined,
    })
    expect(isValid).toBe(false)
  })
})

describe("sanitizeString", () => {
  it("should return an empty string if passed a type other than a string", () => {
    expect(util.sanitizeString({} as string)).toBe("")
  })
  it("should trim whitespace", () => {
    expect(util.sanitizeString(" hello   ")).toBe("hello")
  })
  it("should always return an empty string", () => {
    expect(util.sanitizeString("   ")).toBe("")
  })
})

describe("onLine", () => {
  // Spawn a process that outputs anything given on stdin.
  let proc: cp.ChildProcess | undefined

  beforeAll(() => {
    proc = cp.spawn("node", ["-e", 'process.stdin.setEncoding("utf8");process.stdin.on("data", console.log)'])
  })

  afterAll(() => {
    proc?.kill()
  })

  it("should call with individual lines", async () => {
    const size = 100
    const received = new Promise<string[]>((resolve) => {
      const lines: string[] = []
      util.onLine(proc!, (line) => {
        lines.push(line)
        if (lines.length === size) {
          resolve(lines)
        }
      })
    })

    const expected: string[] = []
    for (let i = 0; i < size; ++i) {
      expected.push(generateUuid(i))
    }

    proc?.stdin?.write(expected.join("\n"))

    expect(await received).toEqual(expected)
  })

  describe("used with a process missing stdout ", () => {
    it("should throw an error", async () => {
      // Initialize a process that does not have stdout.
      // "If the child was spawned with stdio set to anything
      // other than 'pipe', then subprocess.stdout will be null."
      // Source: https://stackoverflow.com/a/46024006/3015595
      // Other source: https://nodejs.org/api/child_process.html#child_process_subprocess_stdout
      // NOTE@jsjoeio - I'm not sure if this actually happens though
      // which is why I have to set proc.stdout = null
      // a couple lines below.
      const proc = cp.spawn("node", [], {
        stdio: "ignore",
      })
      const mockCallback = jest.fn()

      expect(() => util.onLine(proc, mockCallback)).toThrowError(/stdout/)

      // Cleanup
      proc?.kill()
    })
  })
})

describe("escapeHtml", () => {
  it("should escape HTML", () => {
    expect(util.escapeHtml(`<div class="error">"'ello & world"</div>`)).toBe(
      "&lt;div class=&quot;error&quot;&gt;&quot;&apos;ello &amp; world&quot;&lt;/div&gt;",
    )
  })
})

describe("isFile", () => {
  const testDir = path.join(tmpdir, "tests", "isFile")
  let pathToFile = ""

  beforeEach(async () => {
    pathToFile = path.join(testDir, "foo.txt")
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(pathToFile, "hello")
  })
  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })
  it("should return false if the path doesn't exist", async () => {
    expect(await util.isFile(testDir)).toBe(false)
  })
  it("should return true if is file", async () => {
    expect(await util.isFile(pathToFile)).toBe(true)
  })
})

describe("humanPath", () => {
  it("should return an empty string if no path provided", () => {
    const mockHomedir = "/home/coder"
    const actual = util.humanPath(mockHomedir)
    const expected = ""
    expect(actual).toBe(expected)
  })
  it("should replace the homedir with ~", () => {
    const mockHomedir = "/home/coder"
    const path = `${mockHomedir}/code-server`
    const actual = util.humanPath(mockHomedir, path)
    const expected = "~/code-server"
    expect(actual).toBe(expected)
  })
})
