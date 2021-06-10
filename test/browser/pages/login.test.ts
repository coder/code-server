import { JSDOM } from "jsdom"
import { LocationLike } from "../../unit/util.test"

describe("login", () => {
  // TODO test for when el is defined
  describe("there is an element with id 'base'", () => {
    // let initialDom: Document
    beforeEach(() => {
      const dom = new JSDOM()
      // initialDom = dom.window.document
      global.document = dom.window.document

      const location: LocationLike = {
        pathname: "/healthz",
        origin: "http://localhost:8080",
      }

      global.location = location as Location
    })
    afterEach(() => {
      // Reset the global.document
      global.document = undefined as any as Document
      global.location = undefined as any as Location
    })
    it("should set the value to options.base", () => {
      // Mock getElementById
      const spy = jest.spyOn(document, "getElementById")
      // Create a fake element and set the attribute
      const mockElement = document.createElement("input")
      mockElement.setAttribute("id", "base")
      mockElement.setAttribute(
        "data-settings",
        '{"base":"./hello-world","csStaticBase":"./static/development/Users/jp/Dev/code-server","logLevel":2,"disableTelemetry":false,"disableUpdateCheck":false}',
      )
      document.body.appendChild(mockElement)
      spy.mockImplementation(() => mockElement)
      // Load file
      require("../../../src/browser/pages/login")
      // Called once by getOptions and the second in

      const el: HTMLInputElement | null = document.querySelector("input#base")
      expect(el?.value).toBe("/hello-world")
    })
  })

  describe("there is no element with id 'base'", () => {
    let initialDom: Document
    beforeEach(() => {
      const dom = new JSDOM()
      initialDom = dom.window.document
      global.document = dom.window.document

      const location: LocationLike = {
        pathname: "/healthz",
        origin: "http://localhost:8080",
      }

      global.location = location as Location
    })
    afterEach(() => {
      // Reset the global.document
      global.document = undefined as any as Document
      global.location = undefined as any as Location
    })

    it("should not change the DOM", () => {
      // Load file
      require("../../../src/browser/pages/login")
      const currentDom = global.document
      expect(initialDom).toBe(currentDom)
    })
  })
})
