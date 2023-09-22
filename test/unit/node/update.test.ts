import { logger } from "@coder/logger"
import * as http from "http"
import * as path from "path"
import { ensureAddress } from "../../../src/node/app"
import { SettingsProvider, UpdateSettings } from "../../../src/node/settings"
import { LatestResponse, UpdateProvider } from "../../../src/node/update"
import { clean, mockLogger, tmpdir } from "../../utils/helpers"

describe("update", () => {
  let version = "1.0.0"
  let spy: string[] = []
  const server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
    if (!request.url) {
      throw new Error("no url")
    }

    spy.push(request.url)

    // Return the latest version.
    if (request.url === "/latest") {
      const latest: LatestResponse = {
        name: version,
      }
      response.writeHead(200)
      return response.end(JSON.stringify(latest))
    }

    if (request.url === "/reject-status-code") {
      response.writeHead(500)
      return response.end("rejected status code test")
    }

    if (request.url === "/no-location-header") {
      response.writeHead(301, "testing", {
        location: "",
      })
      return response.end("rejected status code test")
    }

    if (request.url === "/with-location-header") {
      response.writeHead(301, "testing", {
        location: "/latest",
      })

      return response.end()
    }

    // Checks if url matches /redirect/${number}
    // with optional trailing slash
    const match = request.url.match(/\/redirect\/([0-9]+)\/?$/)
    if (match) {
      if (request.url === "/redirect/0") {
        response.writeHead(200)
        return response.end("done")
      }

      // Subtract 1 from the current redirect number
      // i.e. /redirect/10 -> /redirect/9 -> /redirect/8
      const currentRedirectNumber = parseInt(match[1])
      const newRedirectNumber = currentRedirectNumber - 1

      response.writeHead(302, "testing", {
        location: `/redirect/${String(newRedirectNumber)}`,
      })
      return response.end("")
    }

    // Anything else is a 404.
    response.writeHead(404)
    return response.end("not found")
  })

  let _settings: SettingsProvider<UpdateSettings> | undefined
  const settings = (): SettingsProvider<UpdateSettings> => {
    if (!_settings) {
      throw new Error("Settings provider has not been created")
    }
    return _settings
  }

  let _provider: UpdateProvider | undefined
  const provider = (): UpdateProvider => {
    if (!_provider) {
      throw new Error("Update provider has not been created")
    }
    return _provider
  }

  let address = new URL("http://localhost")
  beforeAll(async () => {
    mockLogger()

    const testName = "update"
    await clean(testName)
    const testDir = await tmpdir(testName)
    const jsonPath = path.join(testDir, "update.json")
    _settings = new SettingsProvider<UpdateSettings>(jsonPath)

    await new Promise((resolve, reject) => {
      server.on("error", reject)
      server.on("listening", resolve)
      server.listen({
        port: 0,
        host: "localhost",
      })
    })

    const addr = ensureAddress(server, "http")
    if (typeof addr === "string") {
      throw new Error("unable to run update tests with unix sockets")
    }
    address = addr
    address.pathname = "/latest"
    _provider = new UpdateProvider(address.toString(), _settings)
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    spy = []
  })

  it("should get the latest", async () => {
    version = "2.1.0"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate()

    await expect(settings().read()).resolves.toEqual({ update })
    expect(isNaN(update.checked)).toEqual(false)
    expect(update.checked).toBeGreaterThanOrEqual(now)
    expect(update.checked).toBeLessThanOrEqual(Date.now())
    expect(update.version).toStrictEqual("2.1.0")
    expect(spy).toEqual(["/latest"])
  })

  it("should keep existing information", async () => {
    version = "3.0.1"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate()

    await expect(settings().read()).resolves.toEqual({ update })
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked).toBeLessThanOrEqual(now)
    expect(update.version).toStrictEqual("2.1.0")
    expect(spy).toEqual([])
  })

  it("should force getting the latest", async () => {
    version = "4.1.1"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate(true)

    await expect(settings().read()).resolves.toEqual({ update })
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked).toBeGreaterThanOrEqual(now)
    expect(update.checked).toBeLessThanOrEqual(Date.now())
    expect(update.version).toStrictEqual("4.1.1")
    expect(spy).toStrictEqual(["/latest"])
  })

  it("should get latest after interval passes", async () => {
    const p = provider()
    await p.getUpdate()
    expect(spy).toEqual([])

    let checked = Date.now() - 1000 * 60 * 60 * 23
    await settings().write({ update: { checked, version } })
    await p.getUpdate()
    expect(spy).toEqual([])

    checked = Date.now() - 1000 * 60 * 60 * 25
    await settings().write({ update: { checked, version } })

    const update = await p.getUpdate()
    expect(update.checked).not.toStrictEqual(checked)
    expect(spy).toStrictEqual(["/latest"])
  })

  it("should check if it's the current version", async () => {
    version = "9999999.99999.9999"

    const p = provider()
    let update = await p.getUpdate(true)
    expect(p.isLatestVersion(update)).toStrictEqual(false)

    version = "0.0.0"
    update = await p.getUpdate(true)
    expect(p.isLatestVersion(update)).toStrictEqual(true)

    // Old version format; make sure it doesn't report as being later.
    version = "999999.9999-invalid999.99.9"
    update = await p.getUpdate(true)
    expect(p.isLatestVersion(update)).toStrictEqual(true)
  })

  it("should not reject if unable to fetch", async () => {
    let provider = new UpdateProvider("invalid", settings())
    let now = Date.now()
    let update = await provider.getUpdate(true)
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked).toBeGreaterThanOrEqual(now)
    expect(update.checked).toBeLessThanOrEqual(Date.now())
    expect(update.version).toStrictEqual("unknown")

    provider = new UpdateProvider("http://probably.invalid.dev.localhost/latest", settings())
    now = Date.now()
    update = await provider.getUpdate(true)
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked).toBeGreaterThanOrEqual(now)
    expect(update.checked).toBeLessThanOrEqual(Date.now())
    expect(update.version).toStrictEqual("unknown")
  })

  it("should reject if response has status code 500", async () => {
    address.pathname = "/reject-status-code"
    const provider = new UpdateProvider(address.toString(), settings())
    const update = await provider.getUpdate(true)

    expect(update.version).toBe("unknown")
    expect(logger.error).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith("Failed to get latest version", {
      identifier: "error",
      value: `${address.toString()}: 500`,
    })
  })

  it("should reject if no location header provided", async () => {
    address.pathname = "/no-location-header"
    const provider = new UpdateProvider(address.toString(), settings())
    const update = await provider.getUpdate(true)

    expect(update.version).toBe("unknown")
    expect(logger.error).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith("Failed to get latest version", {
      identifier: "error",
      value: `received redirect with no location header`,
    })
  })

  it("should resolve the request with response.headers.location", async () => {
    version = "4.1.1"
    address.pathname = "/with-location-header"
    const provider = new UpdateProvider(address.toString(), settings())
    const update = await provider.getUpdate(true)

    expect(logger.error).not.toHaveBeenCalled()
    expect(update.version).toBe("4.1.1")
  })

  it("should reject if more than 10 redirects", async () => {
    address.pathname = "/redirect/11"
    const provider = new UpdateProvider(address.toString(), settings())
    const update = await provider.getUpdate(true)

    expect(update.version).toBe("unknown")
    expect(logger.error).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith("Failed to get latest version", {
      identifier: "error",
      value: `reached max redirects`,
    })
  })
})
