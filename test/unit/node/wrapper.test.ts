import { ChildProcess, ParentProcess, isChild } from "../../../src/node/wrapper"

describe("wrapper", () => {
  describe("isChild", () => {
    it("should return false for parent process", () => {
      const p = new ParentProcess("1")
      expect(isChild(p)).toBe(false)
    })
  })
  it("should return false for parent process", () => {
    const childProc = new ChildProcess(1)
    expect(isChild(childProc)).toBe(true)
  })
})
