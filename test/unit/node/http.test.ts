import { relativeRoot } from "../../../src/node/http"

describe("http", () => {
  it("should construct a relative path to the root", () => {
    expect(relativeRoot("/")).toStrictEqual(".")
    expect(relativeRoot("/foo")).toStrictEqual(".")
    expect(relativeRoot("/foo/")).toStrictEqual("./..")
    expect(relativeRoot("/foo/bar ")).toStrictEqual("./..")
    expect(relativeRoot("/foo/bar/")).toStrictEqual("./../..")
  })
})
