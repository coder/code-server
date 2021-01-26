import { normalize } from "../src/common/util"

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
})
