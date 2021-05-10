import { getEnvPaths } from "../../../src/node/util"

describe("getEnvPaths", () => {
  it("should return an object with the data, config and runtime path", () => {
    const actualPaths = getEnvPaths()
    expect(actualPaths.hasOwnProperty("data")).toBe(true)
    expect(actualPaths.hasOwnProperty("config")).toBe(true)
    expect(actualPaths.hasOwnProperty("runtime")).toBe(true)
  })
})
