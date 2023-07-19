import { getMockReq } from "@jest-mock/express"
import * as http from "../../../src/node/http"
import { mockLogger } from "../../utils/helpers"

describe("http", () => {
  beforeEach(() => {
    mockLogger()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should construct a relative path to the root", () => {
    expect(http.relativeRoot("/")).toStrictEqual(".")
    expect(http.relativeRoot("/foo")).toStrictEqual(".")
    expect(http.relativeRoot("/foo/")).toStrictEqual("./..")
    expect(http.relativeRoot("/foo/bar ")).toStrictEqual("./..")
    expect(http.relativeRoot("/foo/bar/")).toStrictEqual("./../..")
  })

  describe("origin", () => {
    ;[
      {
        origin: "",
        host: "",
      },
      {
        origin: "http://localhost:8080",
        host: "",
        expected: "no host headers",
      },
      {
        origin: "http://localhost:8080",
        host: " ",
        expected: "does not match",
      },
      {
        origin: "http://localhost:8080",
        host: "localhost:8080",
      },
      {
        origin: "http://localhost:8080",
        host: "localhost:8081",
        expected: "does not match",
      },
      {
        origin: "localhost:8080",
        host: "localhost:8080",
        expected: "does not match", // Gets parsed as host: localhost and path: 8080.
      },
      {
        origin: "test.org",
        host: "localhost:8080",
        expected: "malformed", // Parsing fails completely.
      },
    ].forEach((test) => {
      ;[
        ["host", test.host],
        ["x-forwarded-host", test.host],
        ["x-forwarded-host", `${test.host}, ${test.host}`],
        ["forwarded", `for=127.0.0.1, host=${test.host}, proto=http`],
        ["forwarded", `for=127.0.0.1;proto=http;host=${test.host}`],
        ["forwarded", `proto=http;host=${test.host}, for=127.0.0.1`],
      ].forEach(([key, value]) => {
        it(`${test.origin} -> [${key}: ${value}]`, () => {
          const req = getMockReq({
            originalUrl: "localhost:8080",
            headers: {
              origin: test.origin,
              [key]: value,
            },
            args: {},
          })
          if (typeof test.expected === "string") {
            expect(() => http.authenticateOrigin(req)).toThrow(test.expected)
          } else {
            expect(() => http.authenticateOrigin(req)).not.toThrow()
          }
        })
      })
    })
  })

  describe("constructRedirectPath", () => {
    it("should preserve slashes in queryString so they are human-readable", () => {
      const mockReq = getMockReq({
        originalUrl: "localhost:8080",
      })
      const mockQueryParams = { folder: "/Users/jp/dev/coder" }
      const mockTo = ""
      const actual = http.constructRedirectPath(mockReq, mockQueryParams, mockTo)
      const expected = "./?folder=/Users/jp/dev/coder"
      expect(actual).toBe(expected)
    })
    it("should use an empty string if no query params", () => {
      const mockReq = getMockReq({
        originalUrl: "localhost:8080",
      })
      const mockQueryParams = {}
      const mockTo = ""
      const actual = http.constructRedirectPath(mockReq, mockQueryParams, mockTo)
      const expected = "./"
      expect(actual).toBe(expected)
    })
    it("should append the 'to' path relative to the originalUrl", () => {
      const mockReq = getMockReq({
        originalUrl: "localhost:8080",
      })
      const mockQueryParams = {}
      const mockTo = "vscode"
      const actual = http.constructRedirectPath(mockReq, mockQueryParams, mockTo)
      const expected = "./vscode"
      expect(actual).toBe(expected)
    })
    it("should append append queryParams after 'to' path", () => {
      const mockReq = getMockReq({
        originalUrl: "localhost:8080",
      })
      const mockQueryParams = { folder: "/Users/jp/dev/coder" }
      const mockTo = "vscode"
      const actual = http.constructRedirectPath(mockReq, mockQueryParams, mockTo)
      const expected = "./vscode?folder=/Users/jp/dev/coder"
      expect(actual).toBe(expected)
    })
  })
})
