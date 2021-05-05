import { promises as fs } from "fs"
import * as http from "http"
import * as path from "path"
import { tmpdir } from "../../src/node/constants"
import { SettingsProvider, UpdateSettings } from "../../src/node/settings"
import { LatestResponse, UpdateProvider } from "../../src/node/update"

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

    // Anything else is a 404.
    response.writeHead(404)
    response.end("not found")
  })

  const jsonPath = path.join(tmpdir, "tests/updates/update.json")
  const settings = new SettingsProvider<UpdateSettings>(jsonPath)

  let _provider: UpdateProvider | undefined
  const provider = (): UpdateProvider => {
    if (!_provider) {
      const address = server.address()
      if (!address || typeof address === "string" || !address.port) {
        throw new Error("unexpected address")
      }
      _provider = new UpdateProvider(`http://${address.address}:${address.port}/latest`, settings)
    }
    return _provider
  }

  beforeAll(async () => {
    await new Promise((resolve, reject) => {
      server.on("error", reject)
      server.on("listening", resolve)
      server.listen({
        port: 0,
        host: "localhost",
      })
    })
    await fs.rmdir(path.join(tmpdir, "tests/updates"), { recursive: true })
    await fs.mkdir(path.join(tmpdir, "tests/updates"), { recursive: true })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    spy = []
  })

  it("should get the latest", async () => {
    version = "2.1.0"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate()

    await expect(settings.read()).resolves.toEqual({ update })
    expect(isNaN(update.checked)).toEqual(false)
    expect(update.checked < Date.now() && update.checked >= now).toEqual(true)
    expect(update.version).toStrictEqual("2.1.0")
    expect(spy).toEqual(["/latest"])
  })

  it("should keep existing information", async () => {
    version = "3.0.1"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate()

    await expect(settings.read()).resolves.toEqual({ update })
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked < now).toBe(true)
    expect(update.version).toStrictEqual("2.1.0")
    expect(spy).toEqual([])
  })

  it("should force getting the latest", async () => {
    version = "4.1.1"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate(true)

    await expect(settings.read()).resolves.toEqual({ update })
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked < Date.now() && update.checked >= now).toStrictEqual(true)
    expect(update.version).toStrictEqual("4.1.1")
    expect(spy).toStrictEqual(["/latest"])
  })

  it("should get latest after interval passes", async () => {
    const p = provider()
    await p.getUpdate()
    expect(spy).toEqual([])

    let checked = Date.now() - 1000 * 60 * 60 * 23
    await settings.write({ update: { checked, version } })
    await p.getUpdate()
    expect(spy).toEqual([])

    checked = Date.now() - 1000 * 60 * 60 * 25
    await settings.write({ update: { checked, version } })

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
    let provider = new UpdateProvider("invalid", settings)
    let now = Date.now()
    let update = await provider.getUpdate(true)
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked < Date.now() && update.checked >= now).toEqual(true)
    expect(update.version).toStrictEqual("unknown")

    provider = new UpdateProvider("http://probably.invalid.dev.localhost/latest", settings)
    now = Date.now()
    update = await provider.getUpdate(true)
    expect(isNaN(update.checked)).toStrictEqual(false)
    expect(update.checked < Date.now() && update.checked >= now).toEqual(true)
    expect(update.version).toStrictEqual("unknown")
  })
})
