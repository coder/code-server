/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom"
import {
  getNlsConfiguration,
  nlsConfigElementId,
  setBodyBackgroundToThemeBackgroundColor,
} from "../../../../src/browser/pages/vscode"

describe("vscode", () => {
  describe("getNlsConfiguration", () => {
    beforeEach(() => {
      const { window } = new JSDOM()
      global.document = window.document
    })

    it("should throw an error if Document is undefined", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not parse NLS configuration. document is undefined.`

      expect(() => {
        getNlsConfiguration(undefined as any as Document)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if no nlsConfigElement", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not parse NLS configuration. Could not find nlsConfigElement with id: ${nlsConfigElementId}`

      expect(() => {
        getNlsConfiguration(document)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if no nlsConfig", () => {
      const mockElement = document.createElement("div")
      mockElement.setAttribute("id", nlsConfigElementId)
      document.body.appendChild(mockElement)

      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not parse NLS configuration. Found nlsConfigElement but missing data-settings attribute.`

      expect(() => {
        getNlsConfiguration(document)
      }).toThrowError(errorMessage)

      document.body.removeChild(mockElement)
    })
    it("should return the correct configuration", () => {
      const mockElement = document.createElement("div")
      const dataSettings = {
        first: "Jane",
        last: "Doe",
      }

      mockElement.setAttribute("id", nlsConfigElementId)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      document.body.appendChild(mockElement)
      const actual = getNlsConfiguration(global.document)

      expect(actual).toStrictEqual(dataSettings)

      document.body.removeChild(mockElement)
    })
  })
  describe("setBodyBackgroundToThemeBackgroundColor", () => {
    beforeEach(() => {
      // We need to set the url in the JSDOM constructor
      // to prevent this error "SecurityError: localStorage is not available for opaque origins"
      // See: https://github.com/jsdom/jsdom/issues/2304#issuecomment-622314949
      const { window } = new JSDOM("", { url: "http://localhost" })
      global.document = window.document
      global.localStorage = window.localStorage
    })
    it("should return null", () => {
      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(setBodyBackgroundToThemeBackgroundColor(document, localStorage)).toBeNull()

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if Document is undefined", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Document is undefined.`

      expect(() => {
        // @ts-expect-error We need to test when document is undefined
        setBodyBackgroundToThemeBackgroundColor(undefined, localStorage)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if localStorage is undefined", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. localStorage is undefined.`

      expect(() => {
        // @ts-expect-error We need to test when localStorage is undefined
        setBodyBackgroundToThemeBackgroundColor(document, undefined)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if it can't find colorThemeData in localStorage", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Could not find colorThemeData in localStorage.`

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if there is an error parsing colorThemeData from localStorage", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Could not parse colorThemeData from localStorage.`

      localStorage.setItem(
        "colorThemeData",
        '{"id":"vs-dark max-SS-Cyberpunk-themes-cyberpunk-umbra-color-theme-json","label":"Activate UMBRA protocol","settingsId":"Activate "errorForeground":"#ff3270","foreground":"#ffffff","sideBarTitle.foreground":"#bbbbbb"},"watch\\":::false}',
      )

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if there is no colorMap property", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData is missing colorMap.`

      const test = {
        id: "hey-joe",
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if there is no editor.background color", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData.colorMap["editor.background"] is undefined.`

      const test = {
        id: "hey-joe",
        colorMap: {
          editor: "#fff",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should set the body background to the editor background color", () => {
      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      setBodyBackgroundToThemeBackgroundColor(document, localStorage)

      // When the body.style.backgroundColor is set using hex
      // it is converted to rgb
      // which is why we use that in the assertion
      expect(document.body.style.backgroundColor).toBe("rgb(255, 50, 112)")

      localStorage.removeItem("colorThemeData")
    })
  })
})
