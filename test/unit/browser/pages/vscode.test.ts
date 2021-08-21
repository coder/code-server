/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom"
import { InternalNLSConfiguration } from "../../../../lib/vscode/src/vs/base/node/languagePacks"
import {
  getNlsConfiguration,
  getConfigurationForLoader,
  setBodyBackgroundToThemeBackgroundColor,
  _createScriptURL,
  main,
  createBundlePath,
  NLSConfigurationWeb,
} from "../../../../src/browser/pages/vscode"
import { WORKBENCH_WEB_CONFIG_ID } from "../../../../src/node/constants"

interface MockWorkbenchConfig {
  nlsConfiguration: Pick<NLSConfigurationWeb, "locale" | "availableLanguages">
}

const createMockDataSettings = (): MockWorkbenchConfig => ({
  nlsConfiguration: {
    locale: "en",
    availableLanguages: {
      en: "English",
      de: "German",
    },
  },
})

describe("vscode", () => {
  describe("getNlsConfiguration", () => {
    let _document: Document

    beforeEach(() => {
      // We use underscores to not confuse with global values
      const { window: _window } = new JSDOM()
      _document = _window.document
    })

    it("should throw an error if no Workbench element", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not find Workbench element`

      expect(() => {
        getNlsConfiguration(_document, "")
      }).toThrowError(errorMessage)
    })
    it("should throw an error if no nlsConfig", () => {
      const mockElement = _document.createElement("div")
      mockElement.setAttribute("id", WORKBENCH_WEB_CONFIG_ID)
      _document.body.appendChild(mockElement)

      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not find Workbench data`

      expect(() => {
        getNlsConfiguration(_document, "")
      }).toThrowError(errorMessage)

      _document.body.removeChild(mockElement)
    })
    it("should return the correct configuration", () => {
      const mockElement = _document.createElement("div")
      const dataSettings = createMockDataSettings()

      mockElement.setAttribute("id", WORKBENCH_WEB_CONFIG_ID)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      _document.body.appendChild(mockElement)
      const actual = getNlsConfiguration(_document, "")

      expect(actual).toStrictEqual(dataSettings.nlsConfiguration)

      _document.body.removeChild(mockElement)
    })
    it("should return have loadBundle property if _resolvedLangaugePackCoreLocation", () => {
      const mockElement = _document.createElement("div")

      const dataSettings = createMockDataSettings()
      ;(dataSettings.nlsConfiguration as InternalNLSConfiguration)._resolvedLanguagePackCoreLocation = "./"

      mockElement.setAttribute("id", WORKBENCH_WEB_CONFIG_ID)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      _document.body.appendChild(mockElement)
      const nlsConfig = getNlsConfiguration<InternalNLSConfiguration>(_document, "")

      expect(nlsConfig._resolvedLanguagePackCoreLocation).not.toBe(undefined)
      expect(nlsConfig.loadBundle).not.toBe(undefined)

      _document.body.removeChild(mockElement)
    })
  })
  describe("createBundlePath", () => {
    it("should return the correct path", () => {
      const _resolvedLangaugePackCoreLocation = "./languages"
      const bundle = "/bundle.js"
      const expected = "./languages/!bundle.js.nls.json"
      const actual = createBundlePath(_resolvedLangaugePackCoreLocation, bundle)
      expect(actual).toBe(expected)
    })
  })
  describe("setBodyBackgroundToThemeBackgroundColor", () => {
    let _document: Document
    let _localStorage: Storage

    beforeEach(() => {
      // We need to set the url in the JSDOM constructor
      // to prevent this error "SecurityError: localStorage is not available for opaque origins"
      // See: https://github.com/jsdom/jsdom/issues/2304#issuecomment-622314949
      const { window: _window } = new JSDOM("", { url: "http://localhost" })
      _document = _window.document
      _localStorage = _window.localStorage
    })
    it("should return null", () => {
      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      _localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)).toBeNull()

      _localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if it can't find colorThemeData in localStorage", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Could not find colorThemeData in localStorage.`

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if there is an error parsing colorThemeData from localStorage", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Could not parse colorThemeData from localStorage.`

      _localStorage.setItem(
        "colorThemeData",
        '{"id":"vs-dark max-SS-Cyberpunk-themes-cyberpunk-umbra-color-theme-json","label":"Activate UMBRA protocol","settingsId":"Activate "errorForeground":"#ff3270","foreground":"#ffffff","sideBarTitle.foreground":"#bbbbbb"},"watch\\":::false}',
      )

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if there is no colorMap property", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData is missing colorMap.`

      const test = {
        id: "hey-joe",
      }
      _localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)
      }).toThrowError(errorMessage)

      _localStorage.removeItem("colorThemeData")
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
      _localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)
      }).toThrowError(errorMessage)

      _localStorage.removeItem("colorThemeData")
    })
    it("should set the body background to the editor background color", () => {
      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      _localStorage.setItem("colorThemeData", JSON.stringify(test))

      setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)

      // When the body.style.backgroundColor is set using hex
      // it is converted to rgb
      // which is why we use that in the assertion
      expect(_document.body.style.backgroundColor).toBe("rgb(255, 50, 112)")

      _localStorage.removeItem("colorThemeData")
    })
  })
  describe("getConfigurationForLoader", () => {
    let _window: Window

    beforeEach(() => {
      const { window: __window } = new JSDOM()
      // @ts-expect-error the Window from JSDOM is not exactly the same as Window
      // so we expect an error here
      _window = __window
    })
    it("should return a loader object (with undefined trustedTypesPolicy)", () => {
      const options = {
        base: ".",
        csStaticBase: "/",
        logLevel: 1,
      }

      const { nlsConfiguration } = createMockDataSettings()

      const loader = getConfigurationForLoader({
        options,
        _window,
        nlsConfiguration,
      })

      expect(loader).toStrictEqual({
        baseUrl: "http://localhost//lib/vscode/out",
        paths: {
          "iconv-lite-umd": "../node_modules/iconv-lite-umd/lib/iconv-lite-umd.js",
          jschardet: "../node_modules/jschardet/dist/jschardet.min.js",
          "tas-client-umd": "../node_modules/tas-client-umd/lib/tas-client-umd.js",
          "vscode-oniguruma": "../node_modules/vscode-oniguruma/release/main",
          "vscode-textmate": "../node_modules/vscode-textmate/release/main",
          xterm: "../node_modules/xterm/lib/xterm.js",
          "xterm-addon-search": "../node_modules/xterm-addon-search/lib/xterm-addon-search.js",
          "xterm-addon-unicode11": "../node_modules/xterm-addon-unicode11/lib/xterm-addon-unicode11.js",
          "xterm-addon-webgl": "../node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js",
        },
        recordStats: true,

        // TODO@jsjoeio address trustedTypesPolicy part
        // might need to look up types
        // and find a way to test the function
        // maybe extract function into function
        // and test manually
        trustedTypesPolicy: undefined,
        "vs/nls": nlsConfiguration,
      })
    })
    it("should return a loader object with trustedTypesPolicy", () => {
      function mockCreatePolicy(policyName: string, options: TrustedTypePolicyOptions) {
        return {
          name: policyName,
          ...options,
        }
      }

      const mockFn = jest.fn(mockCreatePolicy)

      _window.trustedTypes = <TrustedTypePolicyFactory>{
        createPolicy: mockFn as TrustedTypePolicyFactory["createPolicy"],
      }

      const options = {
        base: "/",
        csStaticBase: "/",
        logLevel: 1,
      }
      const nlsConfig = {
        first: "Jane",
        last: "Doe",
        locale: "en",
        availableLanguages: {},
      }
      const loader = getConfigurationForLoader({
        options,
        _window,
        nlsConfiguration: nlsConfig,
      })

      expect(loader.trustedTypesPolicy).not.toBe(undefined)
      expect(loader.trustedTypesPolicy!.name).toBe("amdLoader")
    })
  })
  describe("_createScriptURL", () => {
    it("should return the correct url", () => {
      const url = _createScriptURL("localhost/foo/bar.js", "localhost")

      expect(url).toBe("localhost/foo/bar.js")
    })
    it("should throw if the value doesn't start with the origin", () => {
      expect(() => {
        _createScriptURL("localhost/foo/bar.js", "coder.com")
      }).toThrow("Invalid script url: localhost/foo/bar.js")
    })
  })
  describe("main", () => {
    let _window: Window
    let _document: Document
    let _localStorage: Storage

    beforeEach(() => {
      // We need to set the url in the JSDOM constructor
      // to prevent this error "SecurityError: localStorage is not available for opaque origins"
      // See: https://github.com/jsdom/jsdom/issues/2304#issuecomment-62231494
      const { window: __window } = new JSDOM("", { url: "http://localhost" })
      // @ts-expect-error the Window from JSDOM is not exactly the same as Window
      // so we expect an error here
      _window = __window
      _document = __window.document
      _localStorage = __window.localStorage

      const mockElement = _document.createElement("div")
      const dataSettings = createMockDataSettings()

      mockElement.setAttribute("id", WORKBENCH_WEB_CONFIG_ID)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      _document.body.appendChild(mockElement)

      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      _localStorage.setItem("colorThemeData", JSON.stringify(test))
    })
    afterEach(() => {
      _localStorage.removeItem("colorThemeData")
    })
    it("should throw if document is missing", () => {
      expect(() => {
        main(undefined, _window, _localStorage)
      }).toThrow("document is undefined.")
    })
    it("should throw if window is missing", () => {
      expect(() => {
        main(_document, undefined, _localStorage)
      }).toThrow("window is undefined.")
    })
    it("should throw if localStorage is missing", () => {
      expect(() => {
        main(_document, _window, undefined)
      }).toThrow("localStorage is undefined.")
    })
    it("should add loader to self.require", () => {
      main(_document, _window, _localStorage)

      expect(Object.prototype.hasOwnProperty.call(self, "require")).toBe(true)
    })
    it("should not throw in browser context", () => {
      // Assuming we call it in a normal browser context
      // where everything is defined
      expect(() => {
        main(_document, _window, _localStorage)
      }).not.toThrow()
    })
  })
})
