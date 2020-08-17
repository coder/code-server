import * as assert from "assert"
import { normalize } from "../src/common/util"

describe("util", () => {
  describe("normalize", () => {
    it("should remove multiple slashes", () => {
      assert.equal(normalize("//foo//bar//baz///mumble"), "/foo/bar/baz/mumble")
    })

    it("should remove trailing slashes", () => {
      assert.equal(normalize("qux///"), "qux")
    })

    it("should preserve trailing slash if it exists", () => {
      assert.equal(normalize("qux///", true), "qux/")
      assert.equal(normalize("qux", true), "qux")
    })
  })
})
