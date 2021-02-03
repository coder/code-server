// Note: we need to import logger from the root
// because this is the logger used in logError in ../src/common/util
import { logger } from "../node_modules/@coder/logger"
import {
  arrayify,
  getFirstString,
  logError,
  normalize,
  plural,
  resolveBase,
  split,
  trimSlashes,
} from "../src/common/util"

type LocationLike = Pick<Location, "pathname" | "origin">

describe("util", () => {
  describe("normalize", () => {
    it("should remove multiple slashes", () => {
      expect(normalize("//foo//bar//baz///mumble")).toBe("/foo/bar/baz/mumble")
    })

    it("should remove trailing slashes", () => {
      expect(normalize("qux///")).toBe("qux")
    })

    it("should preserve trailing slash if it exists", () => {
      expect(normalize("qux///", true)).toBe("qux/")
      expect(normalize("qux", true)).toBe("qux")
    })
  })

  describe("split", () => {
    it("should split at a comma", () => {
      expect(split("Hello,world", ",")).toStrictEqual(["Hello", "world"])
    })

    it("shouldn't split if the delimiter doesn't exist", () => {
      expect(split("Hello world", ",")).toStrictEqual(["Hello world", ""])
    })
  })

  describe("plural", () => {
    it("should add an s if count is greater than 1", () => {
      expect(plural(2, "dog")).toBe("dogs")
    })
    it("should NOT add an s if the count is 1", () => {
      expect(plural(1, "dog")).toBe("dog")
    })
  })

  describe("trimSlashes", () => {
    it("should remove leading slashes", () => {
      expect(trimSlashes("/hello-world")).toBe("hello-world")
    })

    it("should remove trailing slashes", () => {
      expect(trimSlashes("hello-world/")).toBe("hello-world")
    })

    it("should remove both leading and trailing slashes", () => {
      expect(trimSlashes("/hello-world/")).toBe("hello-world")
    })

    it("should remove multiple leading and trailing slashes", () => {
      expect(trimSlashes("///hello-world////")).toBe("hello-world")
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
      expect(resolveBase("localhost:8080")).toBe("/localhost:8080")
    })

    it("should resolve a base with a forward slash at the beginning", () => {
      expect(resolveBase("/localhost:8080")).toBe("/localhost:8080")
    })

    it("should resolve a base with query params", () => {
      expect(resolveBase("localhost:8080?folder=hello-world")).toBe("/localhost:8080")
    })

    it("should resolve a base with a path", () => {
      expect(resolveBase("localhost:8080/hello/world")).toBe("/localhost:8080/hello/world")
    })

    it("should resolve a base to an empty string when not provided", () => {
      expect(resolveBase()).toBe("")
    })
  })

  describe("arrayify", () => {
    it("should return value it's already an array", () => {
      expect(arrayify(["hello", "world"])).toStrictEqual(["hello", "world"])
    })

    it("should wrap the value in an array if not an array", () => {
      expect(
        arrayify({
          name: "Coder",
          version: "3.8",
        }),
      ).toStrictEqual([{ name: "Coder", version: "3.8" }])
    })

    it("should return an empty array if the value is undefined", () => {
      expect(arrayify(undefined)).toStrictEqual([])
    })
  })

  describe("getFirstString", () => {
    it("should return the string if passed a string", () => {
      expect(getFirstString("Hello world!")).toBe("Hello world!")
    })

    it("should get the first string from an array", () => {
      expect(getFirstString(["Hello", "World"])).toBe("Hello")
    })

    it("should return undefined if the value isn't an array or a string", () => {
      expect(getFirstString({ name: "Coder" })).toBe(undefined)
    })
  })

  describe("logError", () => {
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

    it("should log an error with the message and stack trace", () => {
      const message = "You don't have access to that folder."
      const error = new Error(message)

      logError("ui", error)

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith(`ui: ${error.message} ${error.stack}`)
    })

    it("should log an error, even if not an instance of error", () => {
      logError("api", "oh no")

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith("api: oh no")
    })
  })
})
