import { JSDOM } from "jsdom"
import * as util from "../../../src/common/util"
import { createLoggerMock } from "../../utils/helpers"

const dom = new JSDOM()
global.document = dom.window.document

export type LocationLike = Pick<Location, "pathname" | "origin">

describe("util", () => {
  describe("normalize", () => {
    it("should remove multiple slashes", () => {
      expect(util.normalize("//foo//bar//baz///mumble")).toBe("/foo/bar/baz/mumble")
    })

    it("should remove trailing slashes", () => {
      expect(util.normalize("qux///")).toBe("qux")
    })

    it("should preserve trailing slash if it exists", () => {
      expect(util.normalize("qux///", true)).toBe("qux/")
      expect(util.normalize("qux", true)).toBe("qux")
    })
  })

  describe("split", () => {
    it("should split at a comma", () => {
      expect(util.split("Hello,world", ",")).toStrictEqual(["Hello", "world"])
    })

    it("shouldn't split if the delimiter doesn't exist", () => {
      expect(util.split("Hello world", ",")).toStrictEqual(["Hello world", ""])
    })
  })

  describe("plural", () => {
    it("should add an s if count is greater than 1", () => {
      expect(util.plural(2, "dog")).toBe("dogs")
    })
    it("should NOT add an s if the count is 1", () => {
      expect(util.plural(1, "dog")).toBe("dog")
    })
  })

  describe("generateUuid", () => {
    it("should generate a unique uuid", () => {
      const uuid = util.generateUuid()
      const uuid2 = util.generateUuid()
      expect(uuid).toHaveLength(24)
      expect(typeof uuid).toBe("string")
      expect(uuid).not.toBe(uuid2)
    })
    it("should generate a uuid of a specific length", () => {
      const uuid = util.generateUuid(10)
      expect(uuid).toHaveLength(10)
    })
  })

  describe("trimSlashes", () => {
    it("should remove leading slashes", () => {
      expect(util.trimSlashes("/hello-world")).toBe("hello-world")
    })

    it("should remove trailing slashes", () => {
      expect(util.trimSlashes("hello-world/")).toBe("hello-world")
    })

    it("should remove both leading and trailing slashes", () => {
      expect(util.trimSlashes("/hello-world/")).toBe("hello-world")
    })

    it("should remove multiple leading and trailing slashes", () => {
      expect(util.trimSlashes("///hello-world////")).toBe("hello-world")
    })
  })

  describe("resolveBase", () => {
    beforeEach(() => {
      const location: LocationLike = {
        pathname: "/healthz",
        origin: "http://localhost:8080",
      }

      // Because resolveBase is not a pure function
      // and relies on the global location to be set
      // we set it before all the tests
      // and tell TS that our location should be looked at
      // as Location (even though it's missing some properties)
      global.location = location as Location
    })

    it("should resolve a base", () => {
      expect(util.resolveBase("localhost:8080")).toBe("/localhost:8080")
    })

    it("should resolve a base with a forward slash at the beginning", () => {
      expect(util.resolveBase("/localhost:8080")).toBe("/localhost:8080")
    })

    it("should resolve a base with query params", () => {
      expect(util.resolveBase("localhost:8080?folder=hello-world")).toBe("/localhost:8080")
    })

    it("should resolve a base with a path", () => {
      expect(util.resolveBase("localhost:8080/hello/world")).toBe("/localhost:8080/hello/world")
    })

    it("should resolve a base to an empty string when not provided", () => {
      expect(util.resolveBase()).toBe("")
    })
  })

  describe("getOptions", () => {
    beforeEach(() => {
      const location: LocationLike = {
        pathname: "/healthz",
        origin: "http://localhost:8080",
        // search: "?environmentId=600e0187-0909d8a00cb0a394720d4dce",
      }

      // Because resolveBase is not a pure function
      // and relies on the global location to be set
      // we set it before all the tests
      // and tell TS that our location should be looked at
      // as Location (even though it's missing some properties)
      global.location = location as Location
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it("should return options with base and cssStaticBase even if it doesn't exist", () => {
      expect(util.getClientConfiguration()).toStrictEqual({
        base: "",
        csStaticBase: "",
      })
    })

    it("should return options when they do exist", () => {
      // Mock getElementById
      const spy = jest.spyOn(document, "getElementById")
      // Create a fake element and set the attribute
      const mockElement = document.createElement("div")
      mockElement.setAttribute(
        "data-settings",
        '{"base":".","csStaticBase":"./static/development/Users/jp/Dev/code-server","logLevel":2,"disableUpdateCheck":false}',
      )
      // Return mockElement from the spy
      // this way, when we call "getElementById"
      // it returns the element
      spy.mockImplementation(() => mockElement)

      expect(util.getClientConfiguration()).toStrictEqual({
        base: "",
        csStaticBase: "/static/development/Users/jp/Dev/code-server",
        disableUpdateCheck: false,
        logLevel: 2,
      })
    })

    it("should include queryOpts", () => {
      // Trying to understand how the implementation works
      // 1. It grabs the search params from location.search (i.e. ?)
      // 2. it then grabs the "options" param if it exists
      // 3. then it creates a new options object
      // spreads the original options
      // then parses the queryOpts
      location.search = '?options={"logLevel":2}'
      expect(util.getClientConfiguration()).toStrictEqual({
        base: "",
        csStaticBase: "",
        logLevel: 2,
      })
    })
  })

  describe("arrayify", () => {
    it("should return value it's already an array", () => {
      expect(util.arrayify(["hello", "world"])).toStrictEqual(["hello", "world"])
    })

    it("should wrap the value in an array if not an array", () => {
      expect(
        util.arrayify({
          name: "Coder",
          version: "3.8",
        }),
      ).toStrictEqual([{ name: "Coder", version: "3.8" }])
    })

    it("should return an empty array if the value is undefined", () => {
      expect(util.arrayify(undefined)).toStrictEqual([])
    })
  })

  describe("getFirstString", () => {
    it("should return the string if passed a string", () => {
      expect(util.getFirstString("Hello world!")).toBe("Hello world!")
    })

    it("should get the first string from an array", () => {
      expect(util.getFirstString(["Hello", "World"])).toBe("Hello")
    })

    it("should return undefined if the value isn't an array or a string", () => {
      expect(util.getFirstString({ name: "Coder" })).toBe(undefined)
    })
  })

  describe("logError", () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    const loggerModule = createLoggerMock()

    it("should log an error with the message and stack trace", () => {
      const message = "You don't have access to that folder."
      const error = new Error(message)

      util.logError(loggerModule.logger, "ui", error)

      expect(loggerModule.logger.error).toHaveBeenCalled()
      expect(loggerModule.logger.error).toHaveBeenCalledWith(`ui: ${error.message} ${error.stack}`)
    })

    it("should log an error, even if not an instance of error", () => {
      util.logError(loggerModule.logger, "api", "oh no")

      expect(loggerModule.logger.error).toHaveBeenCalled()
      expect(loggerModule.logger.error).toHaveBeenCalledWith("api: oh no")
    })
  })
})
