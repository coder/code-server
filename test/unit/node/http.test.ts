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

  describe("isTrustedOrigin", () => {
    it("should match exact origins", () => {
      expect(http.isTrustedOrigin("localhost:8080", ["localhost:8080"])).toBe(true)
      expect(http.isTrustedOrigin("example.com", ["example.com"])).toBe(true)
      expect(http.isTrustedOrigin("example.com", ["other.com"])).toBe(false)
    })

    it("should match the wildcard *", () => {
      expect(http.isTrustedOrigin("anything.example.com", ["*"])).toBe(true)
      expect(http.isTrustedOrigin("localhost:8080", ["*"])).toBe(true)
    })

    it("should match *.example.com wildcard (same style as --proxy-domain)", () => {
      expect(http.isTrustedOrigin("sub.example.com", ["*.example.com"])).toBe(true)
      expect(http.isTrustedOrigin("example.com", ["*.example.com"])).toBe(true)
      expect(http.isTrustedOrigin("evil.com", ["*.example.com"])).toBe(false)
      expect(http.isTrustedOrigin("example.com.evil.com", ["*.example.com"])).toBe(false)
    })

    it("should return false for an empty trusted origins list", () => {
      expect(http.isTrustedOrigin("example.com", [])).toBe(false)
    })
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
        origin: "https://example.com",
        host: "example.com:443", // Explicit default port.
      },
      {
        origin: "http://example.com",
        host: "example.com:80",
      },
      {
        origin: "https://example.com",
        host: "example.com:80", // Default port of the other protocol.
        expected: "does not match",
      },
      {
        origin: "https://example.com:8080",
        host: "example.com", // Missing port is not ignored.
        expected: "does not match",
      },
      {
        origin: "https://example.com",
        host: "example.com:8443",
        expected: "does not match",
      },
      {
        origin: "http://example.com:8080",
        host: "other.com",
        expected: "does not match",
      },
      {
        origin: "http://[::1]:8080",
        host: "[::1]:8080",
      },
      {
        origin: "http://[::1]:8080",
        host: "[::1]:8081",
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
      {
        origin: "http://sub.example.com",
        host: "other.com",
        trustedOrigins: ["*.example.com"],
      },
      {
        origin: "http://evil.com",
        host: "other.com",
        trustedOrigins: ["*.example.com"],
        expected: "does not match",
      },
      {
        origin: "http://sub.example.com",
        host: "other.com",
        trustedOrigins: ["*"],
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
            args: {
              "trusted-origins": (test as { trustedOrigins?: string[] }).trustedOrigins,
            },
          })
          if (typeof test.expected === "string") {
            expect(() => http.authenticateOrigin(req)).toThrow(test.expected)
          } else {
            expect(() => http.authenticateOrigin(req)).not.toThrow()
          }
        })
      })
    })

    describe("x-forwarded-port", () => {
      ;[
        {
          origin: "https://example.com:8080",
          headers: { "x-forwarded-host": "example.com", "x-forwarded-port": "8080" },
        },
        {
          origin: "https://example.com",
          headers: { "x-forwarded-host": "example.com", "x-forwarded-port": "443" },
        },
        {
          origin: "http://[::1]:8080",
          headers: { "x-forwarded-host": "[::1]", "x-forwarded-port": "8080" },
        },
        {
          origin: "https://example.com:8080",
          headers: { "x-forwarded-host": "example.com", "x-forwarded-port": "8080, 443" },
        },
        {
          origin: "https://example.com:8080",
          headers: { "x-forwarded-host": "example.com", "x-forwarded-port": "8081" },
          expected: "does not match",
        },
        {
          origin: "https://example.com:8080",
          headers: { "x-forwarded-host": "example.com:8081", "x-forwarded-port": "8080" },
          expected: "does not match", // The port in the host wins.
        },
        {
          origin: "https://example.com:8080",
          headers: { "x-forwarded-host": "example.com", "x-forwarded-port": "foo" },
          expected: "does not match",
        },
        {
          origin: "https://example.com:8080",
          headers: { host: "example.com", "x-forwarded-port": "8080" },
          expected: "does not match", // Only used with X-Forwarded-Host.
        },
        {
          origin: "https://example.com:8080",
          headers: { forwarded: "host=example.com", "x-forwarded-port": "8080" },
          expected: "does not match",
        },
      ].forEach((test) => {
        it(`${test.origin} -> ${JSON.stringify(test.headers)}`, () => {
          const req = getMockReq({
            originalUrl: "localhost:8080",
            headers: {
              origin: test.origin,
              ...test.headers,
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

      it("should not add the port to the host for other uses", () => {
        const req = getMockReq({
          headers: { "x-forwarded-host": "code-8080.example.com", "x-forwarded-port": "443" },
        })
        expect(http.getHost(req)).toBe("code-8080.example.com")
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
