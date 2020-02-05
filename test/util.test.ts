import * as assert from "assert"
import { normalize } from "../src/common/util"
import { extend } from "../src/node/util"

describe("util", () => {
  describe("extend", () => {
    it("should extend", () => {
      const a = { foo: { bar: 0, baz: 2 }, garply: 4, waldo: 6 }
      const b = { foo: { bar: 1, qux: 3 }, garply: "5", fred: 7 }
      const extended = extend(a, b)
      assert.deepEqual(extended, {
        foo: { bar: 1, baz: 2, qux: 3 },
        garply: "5",
        waldo: 6,
        fred: 7,
      })
    })

    it("should make deep copies of the original objects", () => {
      const a = { foo: 0, bar: { frobnozzle: 2 }, mumble: { qux: { thud: 4 } } }
      const b = { foo: 1, bar: { chad: 3 } }
      const extended = extend(a, b)
      assert.notEqual(a.bar, extended.bar)
      assert.notEqual(b.bar, extended.bar)
      assert.notEqual(a.mumble, extended.mumble)
      assert.notEqual(a.mumble.qux, extended.mumble.qux)
    })

    it("should handle mismatch in type", () => {
      const a = { foo: { bar: 0, baz: 2, qux: { mumble: 11 } }, garply: 4, waldo: { thud: 10 } }
      const b = { foo: { bar: [1], baz: { plugh: 8 }, qux: 12 }, garply: { nox: 9 }, waldo: 7 }
      const extended = extend(a, b)
      assert.deepEqual(extended, {
        foo: { bar: [1], baz: { plugh: 8 }, qux: 12 },
        garply: { nox: 9 },
        waldo: 7,
      })
    })
  })

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
