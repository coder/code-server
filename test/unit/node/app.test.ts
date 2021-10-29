import { logger } from "@coder/logger"
import { promises, rmdirSync } from "fs"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import { createApp, ensureAddress, handleArgsSocketCatchError, handleServerError } from "../../../src/node/app"
import { createDefaultArgs, OptionalString, setDefaults } from "../../../src/node/cli"
import { generateCertificate } from "../../../src/node/util"
import { getAvailablePort, tmpdir } from "../../utils/helpers"

describe("createApp", () => {
  let spy: jest.SpyInstance
  let unlinkSpy: jest.SpyInstance
  let port: string
  let tmpDirPath: string
  let tmpFilePath: string

  beforeAll(async () => {
    tmpDirPath = await tmpdir("unlink-socket")
    tmpFilePath = path.join(tmpDirPath, "unlink-socket-file")
  })

  beforeEach(async () => {
    spy = jest.spyOn(logger, "error")
    // NOTE:@jsjoeio
    // Be mindful when spying.
    // You can't spy on fs functions if you do import * as fs
    // You have to import individually, like we do here with promises
    // then you can spy on those modules methods, like unlink.
    // See: https://github.com/aelbore/esbuild-jest/issues/26#issuecomment-893763840
    unlinkSpy = jest.spyOn(promises, "unlink")
    port = (await getAvailablePort()).toString()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
    // Ensure directory was removed
    rmdirSync(tmpDirPath, { recursive: true })
  })

  it("should return an Express app, a WebSockets Express app and an http server", async () => {
    const defaultArgs = await setDefaults({
      ...createDefaultArgs(),
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
      ...createDefaultArgs(),
      port,
    })

    const app = await createApp(defaultArgs)

    const testError = new Error("Test error")
    // We can easily test how the server handles errors
    // By emitting an error event
    // Ref: https://stackoverflow.com/a/33872506/3015595
    app.server.emit("error", testError)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(`http server error: ${testError.message} ${testError.stack}`)

    // Cleanup
    app.dispose()
  })

  it("should reject errors that happen before the server can listen", async () => {
    // We listen on an invalid port
    // causing the app to reject the Promise called at startup
    const port = "2"
    const defaultArgs = await setDefaults({
      ...createDefaultArgs(),
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
      ...createDefaultArgs(),
      socket: tmpFilePath,
    })

    const app = await createApp(defaultArgs)

    expect(unlinkSpy).toHaveBeenCalledTimes(1)
    app.dispose()
  })

  it("should create an https server if args.cert exists", async () => {
    const testCertificate = await generateCertificate("localhost")
    const cert = new OptionalString(testCertificate.cert)
    const defaultArgs = await setDefaults({
      ...createDefaultArgs(),
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

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toThrowErrorMatchingSnapshot()
  })
})

describe("handleArgsSocketCatchError", () => {
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

  it("should log an error if its not an NodeJS.ErrnoException", () => {
    const error = new Error()

    handleArgsSocketCatchError(error)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(error)
  })

  it("should log an error if its not an NodeJS.ErrnoException (and the error has a message)", () => {
    const errorMessage = "handleArgsSocketCatchError Error"
    const error = new Error(errorMessage)

    handleArgsSocketCatchError(error)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(errorMessage)
  })

  it("should not log an error if its a iNodeJS.ErrnoException", () => {
    const error: NodeJS.ErrnoException = new Error()
    error.code = "ENOENT"

    handleArgsSocketCatchError(error)

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it("should log an error if the code is not ENOENT (and the error has a message)", () => {
    const errorMessage = "no access"
    const error: NodeJS.ErrnoException = new Error()
    error.code = "EACCESS"
    error.message = errorMessage

    handleArgsSocketCatchError(error)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(errorMessage)
  })

  it("should log an error if the code is not ENOENT", () => {
    const error: NodeJS.ErrnoException = new Error()
    error.code = "EACCESS"

    handleArgsSocketCatchError(error)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(error)
  })
})
