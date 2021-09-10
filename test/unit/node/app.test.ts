import * as http from "http"
import { ensureAddress } from "../../../src/node/app"
import { getAvailablePort } from "../../utils/helpers"

describe("ensureAddress", () => {
  let mockServer: http.Server

  beforeEach(() => {
    mockServer = http.createServer()
  })

  afterEach(() => {
    mockServer.close()
  })

  it("should throw and error if no address", () => {
    expect(() => ensureAddress(mockServer)).toThrow("server has no address")
  })
  it("should return the address if it exists and not a string", async () => {
    const port = await getAvailablePort()
    mockServer.listen(port)
    const address = ensureAddress(mockServer)
    expect(address).toBe(`http://:::${port}`)
  })
  it("should return the address if it exists", async () => {
    mockServer.address = () => "http://localhost:8080"
    const address = ensureAddress(mockServer)
    expect(address).toBe(`http://localhost:8080`)
  })
})
