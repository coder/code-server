import * as assert from "assert"
import * as fs from "fs-extra"
import * as http from "http"
import * as path from "path"
import { SettingsProvider, UpdateSettings } from "../src/node/settings"
import { LatestResponse, UpdateProvider } from "../src/node/update"
import { tmpdir } from "../src/node/util"

describe.skip("update", () => {
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

  before(async () => {
    await new Promise((resolve, reject) => {
      server.on("error", reject)
      server.on("listening", resolve)
      server.listen({
        port: 0,
        host: "localhost",
      })
    })
    await fs.remove(path.join(tmpdir, "tests/updates"))
    await fs.mkdirp(path.join(tmpdir, "tests/updates"))
  })

  after(() => {
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

    assert.deepEqual({ update }, await settings.read())
    assert.equal(isNaN(update.checked), false)
    assert.equal(update.checked < Date.now() && update.checked >= now, true)
    assert.equal(update.version, "2.1.0")
    assert.deepEqual(spy, ["/latest"])
  })

  it("should keep existing information", async () => {
    version = "3.0.1"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate()

    assert.deepEqual({ update }, await settings.read())
    assert.equal(isNaN(update.checked), false)
    assert.equal(update.checked < now, true)
    assert.equal(update.version, "2.1.0")
    assert.deepEqual(spy, [])
  })

  it("should force getting the latest", async () => {
    version = "4.1.1"

    const p = provider()
    const now = Date.now()
    const update = await p.getUpdate(true)

    assert.deepEqual({ update }, await settings.read())
    assert.equal(isNaN(update.checked), false)
    assert.equal(update.checked < Date.now() && update.checked >= now, true)
    assert.equal(update.version, "4.1.1")
    assert.deepEqual(spy, ["/latest"])
  })

  it("should get latest after interval passes", async () => {
    const p = provider()
    await p.getUpdate()
    assert.deepEqual(spy, [])

    let checked = Date.now() - 1000 * 60 * 60 * 23
    await settings.write({ update: { checked, version } })
    await p.getUpdate()
    assert.deepEqual(spy, [])

    checked = Date.now() - 1000 * 60 * 60 * 25
    await settings.write({ update: { checked, version } })

    const update = await p.getUpdate()
    assert.notEqual(update.checked, checked)
    assert.deepEqual(spy, ["/latest"])
  })

  it("should check if it's the current version", async () => {
    version = "9999999.99999.9999"

    const p = provider()
    let update = await p.getUpdate(true)
    assert.equal(p.isLatestVersion(update), false)

    version = "0.0.0"
    update = await p.getUpdate(true)
    assert.equal(p.isLatestVersion(update), true)

    // Old version format; make sure it doesn't report as being later.
    version = "999999.9999-invalid999.99.9"
    update = await p.getUpdate(true)
    assert.equal(p.isLatestVersion(update), true)
  })

  it("should not reject if unable to fetch", async () => {
    let provider = new UpdateProvider("invalid", settings)
    await assert.doesNotReject(() => provider.getUpdate(true))

    provider = new UpdateProvider("http://probably.invalid.dev.localhost/latest", settings)
    await assert.doesNotReject(() => provider.getUpdate(true))
  })
})
