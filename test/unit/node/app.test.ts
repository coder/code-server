import { logger } from "@coder/logger"
import { promises } from "fs"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import { createApp, ensureAddress, handleArgsSocketCatchError, handleServerError, listen } from "../../../src/node/app"
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

    const testName = "unlink-socket"
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

    expect(() => masterBall()).rejects.toThrow(`listen EACCES: permission denied 127.0.0.1:${port}`)
  })

  it("should unlink a socket before listening on the socket", async () => {
    await promises.writeFile(tmpFilePath, "")
    const defaultArgs = await setDefaults({
      socket: tmpFilePath,
    })

    const app = await createApp(defaultArgs)

    expect(unlinkSpy).toHaveBeenCalledTimes(1)
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
  it("should return the address if it exists", async () => {
    mockServer.address = () => "http://localhost:8080/"
    const address = ensureAddress(mockServer, "http")
    expect(address.toString()).toBe(`http://localhost:8080/`)
  })
})

describe("handleServerError", () => {
  beforeAll(() => {
    mockLogger()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should call reject if resolved is false", async () => {
    const resolved = false
    const reject = jest.fn((err: Error) => undefined)
    const error = new Error("handleServerError Error")

    handleServerError(resolved, error, reject)

    expect(reject).toHaveBeenCalledTimes(1)
    expect(reject).toHaveBeenCalledWith(error)
  })

  it("should log an error if resolved is true", async () => {
    const resolved = true
    const reject = jest.fn((err: Error) => undefined)
    const error = new Error("handleServerError Error")

    handleServerError(resolved, error, reject)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(`http server error: ${error.message} ${error.stack}`)
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
    const error = new Error()

    handleArgsSocketCatchError(error)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(error)
  })

  it("should log an error if its not an NodeJS.ErrnoException (and the error has a message)", () => {
    const errorMessage = "handleArgsSocketCatchError Error"
    const error = new Error(errorMessage)

    handleArgsSocketCatchError(error)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(errorMessage)
  })

  it("should not log an error if its a NodeJS.ErrnoException", () => {
    const error: NodeJS.ErrnoException = new Error()
    error.code = "ENOENT"

    handleArgsSocketCatchError(error)

    expect(logger.error).toHaveBeenCalledTimes(0)
  })

  it("should log an error if the code is not ENOENT (and the error has a message)", () => {
    const errorMessage = "no access"
    const error: NodeJS.ErrnoException = new Error()
    error.code = "EACCESS"
    error.message = errorMessage

    handleArgsSocketCatchError(error)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(errorMessage)
  })

  it("should log an error if the code is not ENOENT", () => {
    const error: NodeJS.ErrnoException = new Error()
    error.code = "EACCESS"

    handleArgsSocketCatchError(error)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(error)
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

  it.only("should log an error if a directory is passed in instead of a file", async () => {
    const errorMessage = "EPERM: operation not permitted, unlink"
    const port = await getAvailablePort()
    const mockArgs = { port, host: "0.0.0.0", socket: tmpDirPath }
    try {
      await listen(mockServer, mockArgs)
    } catch (error) {}

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage))
  })
})
