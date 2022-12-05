import { ChildProcess } from "child_process"
import { ParentProcess, isChild } from "../../../src/node/wrapper"

describe("wrapper", () => {
  describe("isChild", () => {
    it("should return false for parent process", () => {
      const p = new ParentProcess("1")
      expect(isChild(p)).toBe(false)
    })
  })
  it("should return false for parent process", () => {
    const p = new ChildProcess()
    // our ChildProcess isn't exported
    // and shouldn't be for a test so surpressing TS error.
    // @ts-expect-error
    expect(isChild(p)).toBe(false)
  })
})
