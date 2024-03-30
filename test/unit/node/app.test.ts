import { logger } from "@coder/logger"
import { promises } from "fs"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import { createApp, ensureAddress, handleArgsSocketCatchError, listen } from "../../../src/node/app"
import { OptionalString, setDefaults } from "../../../src/node/cli"
import { generateCertificate } from "../../../src/node/util"
import { clean, mockLogger, getAvailablePort, tmpdir } from "../../utils/helpers"

describe("createApp", () => {
  let unlinkSpy: jest.SpyInstance
  let port: number
  let tmpDirPath: string
  let tmpFilePath: string

  beforeAll(async () => {
    mockLogger()

    const testName = "app"
    await clean(testName)
    tmpDirPath = await tmpdir(testName)
    tmpFilePath = path.join(tmpDirPath, "unlink-socket-file")
  })

  beforeEach(async () => {
    // NOTE:@jsjoeio
    // Be mindful when spying.
    // You can't spy on fs functions if you do import * as fs
    // You have to import individually, like we do here with promises
    // then you can spy on those modules methods, like unlink.
    // See: https://github.com/aelbore/esbuild-jest/issues/26#issuecomment-893763840
    unlinkSpy = jest.spyOn(promises, "unlink")
    port = await getAvailablePort()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return an Express app, a WebSockets Express app and an http server", async () => {
    const defaultArgs = await setDefaults({
      port,
    })
    const app = await createApp(defaultArgs)

    // This doesn't check much, but it's a good sanity check
    // to ensure we actually get back values from createApp
    expect(app.router).not.toBeNull()
    expect(app.wsRouter).not.toBeNull()
    expect(app.server).toBeInstanceOf(http.Server)

    // Cleanup
    app.dispose()
  })

  it("should handle error events on the server", async () => {
    const defaultArgs = await setDefaults({
      port,
    })

    const app = await createApp(defaultArgs)

    const testError = new Error("Test error")
    // We can easily test how the server handles errors
    // By emitting an error event
    // Ref: https://stackoverflow.com/a/33872506/3015595
    app.server.emit("error", testError)
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(`http server error: ${testError.message} ${testError.stack}`)

    // Cleanup
    app.dispose()
  })

  it("should reject errors that happen before the server can listen", async () => {
    // We listen on an invalid port
    // causing the app to reject the Promise called at startup
    const port = 2
    const defaultArgs = await setDefaults({
      port,
    })

    async function masterBall() {
      const app = await createApp(defaultArgs)

      const testError = new Error("Test error")

      app.server.emit("error", testError)

      // Cleanup
      app.dispose()
    }

    expect(() => masterBall()).rejects.toThrow("listen EACCES: permission denied")
  })

  it("should unlink a socket before listening on the socket", async () => {
    await promises.writeFile(tmpFilePath, "")
    const defaultArgs = await setDefaults({
      socket: tmpFilePath,
    })

    const app = await createApp(defaultArgs)

    expect(unlinkSpy).toHaveBeenCalledWith(tmpFilePath)
    app.dispose()
  })

  it("should change the file mode of a socket", async () => {
    const defaultArgs = await setDefaults({
      socket: tmpFilePath,
      "socket-mode": "777",
    })

    const app = await createApp(defaultArgs)

    expect((await promises.stat(tmpFilePath)).mode & 0o777).toBe(0o777)
    app.dispose()
  })

  it("should create an https server if args.cert exists", async () => {
    const testCertificate = await generateCertificate("localhost")
    const cert = new OptionalString(testCertificate.cert)
    const defaultArgs = await setDefaults({
      port,
      cert,
      ["cert-key"]: testCertificate.certKey,
    })
    const app = await createApp(defaultArgs)

    // This doesn't check much, but it's a good sanity check
    // to ensure we actually get an https.Server
    expect(app.server).toBeInstanceOf(https.Server)

    // Cleanup
    app.dispose()
  })
})

describe("ensureAddress", () => {
  let mockServer: http.Server

  beforeEach(() => {
    mockServer = http.createServer()
  })

  afterEach(() => {
    mockServer.close()
  })

  it("should throw and error if no address", () => {
    expect(() => ensureAddress(mockServer, "http")).toThrow("Server has no address")
  })
  it("should return the address if it's a string", async () => {
    mockServer.address = () => "/path/to/unix.sock"
    const address = ensureAddress(mockServer, "http")
    expect(address.toString()).toBe(`/path/to/unix.sock`)
  })
  it("should construct URL with an IPv4 address", async () => {
    mockServer.address = () => ({ address: "1.2.3.4", port: 5678, family: "IPv4" })
    const address = ensureAddress(mockServer, "http")
    expect(address.toString()).toBe(`http://1.2.3.4:5678/`)
  })
  it("should construct URL with an IPv6 address", async () => {
    mockServer.address = () => ({ address: "a:b:c:d::1234", port: 5678, family: "IPv6" })
    const address = ensureAddress(mockServer, "http")
    expect(address.toString()).toBe(`http://[a:b:c:d::1234]:5678/`)
  })
})

describe("handleArgsSocketCatchError", () => {
  beforeAll(() => {
    mockLogger()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should log an error if its not an NodeJS.ErrnoException", () => {
    const message = "other message"
    const error = new Error(message)

    expect(() => {
      handleArgsSocketCatchError(error)
    }).toThrowError(error)
  })

  it("should log an error if its not an NodeJS.ErrnoException (and the error has a message)", () => {
    const errorMessage = "handleArgsSocketCatchError Error"
    const error = new Error(errorMessage)

    expect(() => {
      handleArgsSocketCatchError(error)
    }).toThrowError(error)
  })

  it("should not log an error if its a NodeJS.ErrnoException", () => {
    const code = "ENOENT"
    const error: NodeJS.ErrnoException = new Error(code)
    error.code = code

    handleArgsSocketCatchError(error)

    expect(() => {
      handleArgsSocketCatchError(error)
    }).not.toThrowError()
  })

  it("should log an error if the code is not ENOENT (and the error has a message)", () => {
    const errorMessage = "no access"
    const error: NodeJS.ErrnoException = new Error()
    error.code = "EACCESS"
    error.message = errorMessage

    expect(() => {
      handleArgsSocketCatchError(error)
    }).toThrowError(error)
  })

  it("should log an error if the code is not ENOENT", () => {
    const code = "EACCESS"
    const error: NodeJS.ErrnoException = new Error(code)
    error.code = code

    expect(() => {
      handleArgsSocketCatchError(error)
    }).toThrowError(error)
  })
})

describe("listen", () => {
  let tmpDirPath: string
  let mockServer: http.Server

  const testName = "listen"

  beforeEach(async () => {
    await clean(testName)
    mockLogger()
    tmpDirPath = await tmpdir(testName)
    mockServer = http.createServer()
  })

  afterEach(() => {
    mockServer.close()
    jest.clearAllMocks()
  })

  it("should throw an error if a directory is passed in instead of a file", async () => {
    const errorMessage = "EISDIR: illegal operation on a directory, unlink"
    const port = await getAvailablePort()
    const mockArgs = { port, host: "0.0.0.0", socket: tmpDirPath }

    try {
      await listen(mockServer, mockArgs)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as any).message).toMatch(errorMessage)
    }
  })
})
