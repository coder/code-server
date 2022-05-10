import { logger } from "@coder/logger"
import { JSDOM } from "jsdom"
import * as util from "../../../src/common/util"
import { mockLogger } from "../../utils/helpers"

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

  describe("logError", () => {
    beforeAll(() => {
      mockLogger()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("should log an error with the message and stack trace", () => {
      const message = "You don't have access to that folder."
      const error = new Error(message)

      util.logError(logger, "ui", error)

      expect(logger.error).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(`ui: ${error.message} ${error.stack}`)
    })

    it("should log an error, even if not an instance of error", () => {
      util.logError(logger, "api", "oh no")

      expect(logger.error).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith("api: oh no")
    })
  })
})
