import { getOptions, Options } from "../../common/util"
import "../register"

// TODO@jsjoeio: Add proper types.
type FixMeLater = any

// NOTE@jsjoeio
// This lives here ../../../lib/vscode/src/vs/base/common/platform.ts#L106
export const nlsConfigElementId = "vscode-remote-nls-configuration"

type NlsConfiguration = {
  locale: string
  availableLanguages: { [key: string]: string } | {}
  _languagePackId?: string
  _translationsConfigFile?: string
  _cacheRoot?: string
  _resolvedLanguagePackCoreLocation?: string
  _corruptedFile?: string
  _languagePackSupport?: boolean
  loadBundle?: FixMeLater
}

/**
 * Helper function to create the path to the bundle
 * for getNlsConfiguration.
 */
export function createBundlePath(_resolvedLanguagePackCoreLocation: string | undefined, bundle: string) {
  // NOTE@jsjoeio - this comment was here before me
  // Refers to operating systems that use a different path separator.
  // Probably just Windows but we're not sure if "/" breaks on Windows
  // so we'll leave it alone for now.
  // FIXME: Only works if path separators are /.
  return (_resolvedLanguagePackCoreLocation || "") + "/" + bundle.replace(/\//g, "!") + ".nls.json"
}

/**
 * A helper function to get the NLS Configuration settings.
 *
 * This is used by VSCode for localizations (i.e. changing
 * the display language).
 *
 * Make sure to wrap this in a try/catch block when you call it.
 **/
export function getNlsConfiguration(_document: Document, base: string) {
  const errorMsgPrefix = "[vscode]"
  const nlsConfigElement = _document?.getElementById(nlsConfigElementId)
  const dataSettings = nlsConfigElement?.getAttribute("data-settings")

  if (!nlsConfigElement) {
    throw new Error(
      `${errorMsgPrefix} Could not parse NLS configuration. Could not find nlsConfigElement with id: ${nlsConfigElementId}`,
    )
  }

  if (!dataSettings) {
    throw new Error(
      `${errorMsgPrefix} Could not parse NLS configuration. Found nlsConfigElement but missing data-settings attribute.`,
    )
  }

  const nlsConfig = JSON.parse(dataSettings) as NlsConfiguration

  if (nlsConfig._resolvedLanguagePackCoreLocation) {
    // NOTE@jsjoeio
    // Not sure why we use Object.create(null) instead of {}
    // They are not the same
    // See: https://stackoverflow.com/a/15518712/3015595
    // We copied this from ../../../lib/vscode/src/bootstrap.js#L143
    const bundles: {
      [key: string]: string
    } = Object.create(null)

    type LoadBundleCallback = (_: undefined, result?: string) => void

    nlsConfig.loadBundle = async (bundle: string, _language: string, cb: LoadBundleCallback): Promise<void> => {
      const result = bundles[bundle]

      if (result) {
        return cb(undefined, result)
      }

      try {
        const path = createBundlePath(nlsConfig._resolvedLanguagePackCoreLocation, bundle)
        const response = await fetch(`${base}/vscode/resource/?path=${encodeURIComponent(path)}`)
        const json = await response.json()
        bundles[bundle] = json
        return cb(undefined, json)
      } catch (error) {
        return cb(error)
      }
    }
  }

  return nlsConfig
}

type GetLoaderParams = {
  nlsConfig: NlsConfiguration
  options: Options
  _window: Window
}

/**
 * Link to types in the loader source repo
 * https://github.com/microsoft/vscode-loader/blob/main/src/loader.d.ts#L280
 */
type Loader = {
  baseUrl: string
  recordStats: boolean
  // TODO@jsjoeio: There don't appear to be any types for trustedTypes yet.
  trustedTypesPolicy: FixMeLater
  paths: {
    [key: string]: string
  }
  "vs/nls": NlsConfiguration
}

/**
 * A helper function which creates a script url if the value
 * is valid.
 *
 * Extracted into a function to make it easier to test
 */
export function _createScriptURL(value: string, origin: string): string {
  if (value.startsWith(origin)) {
    return value
  }
  throw new Error(`Invalid script url: ${value}`)
}

/**
 * A helper function to get the require loader
 *
 * This used by VSCode/code-server
 * to load files.
 *
 * We extracted the logic into a function so that
 * it's easier to test.
 **/
export function getConfigurationForLoader({ nlsConfig, options, _window }: GetLoaderParams) {
  const loader: Loader = {
    // Without the full URL VS Code will try to load file://.
    baseUrl: `${window.location.origin}${options.csStaticBase}/vendor/modules/code-oss-dev/out`,
    recordStats: true,
    trustedTypesPolicy: (_window as FixMeLater).trustedTypes?.createPolicy("amdLoader", {
      createScriptURL(value: string): string {
        return _createScriptURL(value, window.location.origin)
      },
    }),
    paths: {
      "vscode-textmate": `../node_modules/vscode-textmate/release/main`,
      "vscode-oniguruma": `../node_modules/vscode-oniguruma/release/main`,
      xterm: `../node_modules/xterm/lib/xterm.js`,
      "xterm-addon-search": `../node_modules/xterm-addon-search/lib/xterm-addon-search.js`,
      "xterm-addon-unicode11": `../node_modules/xterm-addon-unicode11/lib/xterm-addon-unicode11.js`,
      "xterm-addon-webgl": `../node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js`,
      "tas-client-umd": `../node_modules/tas-client-umd/lib/tas-client-umd.js`,
      "iconv-lite-umd": `../node_modules/iconv-lite-umd/lib/iconv-lite-umd.js`,
      jschardet: `../node_modules/jschardet/dist/jschardet.min.js`,
    },
    "vs/nls": nlsConfig,
  }

  return loader
}

/**
 * Sets the body background color to match the theme.
 */
export function setBodyBackgroundToThemeBackgroundColor(_document: Document, _localStorage: Storage) {
  const errorMsgPrefix = "[vscode]"
  const colorThemeData = _localStorage.getItem("colorThemeData")

  if (!colorThemeData) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. Could not find colorThemeData in localStorage.`,
    )
  }

  let _colorThemeData
  try {
    // We wrap this JSON.parse logic in a try/catch
    // because it can throw if the JSON is invalid.
    // and instead of throwing a random error
    // we can throw our own error, which will be more helpful
    // to the end user.
    _colorThemeData = JSON.parse(colorThemeData)
  } catch {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. Could not parse colorThemeData from localStorage.`,
    )
  }

  const hasColorMapProperty = Object.prototype.hasOwnProperty.call(_colorThemeData, "colorMap")
  if (!hasColorMapProperty) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData is missing colorMap.`,
    )
  }

  const editorBgColor = _colorThemeData.colorMap["editor.background"]

  if (!editorBgColor) {
    throw new Error(
      `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData.colorMap["editor.background"] is undefined.`,
    )
  }

  _document.body.style.background = editorBgColor

  return null
}

/**
 * A helper function to encapsulate all the
 * logic used in this file.
 *
 * We purposely include all of this in a single function
 * so that it's easier to test.
 */
export function main(_document: Document | undefined, _window: Window | undefined, _localStorage: Storage | undefined) {
  if (!_document) {
    throw new Error(`document is undefined.`)
  }

  if (!_window) {
    throw new Error(`window is undefined.`)
  }

  if (!_localStorage) {
    throw new Error(`localStorage is undefined.`)
  }

  const options = getOptions()
  const nlsConfig = getNlsConfiguration(_document, options.base)

  const loader = getConfigurationForLoader({
    nlsConfig,
    options,
    _window,
  })

  ;(self.require as unknown as Loader) = loader

  setBodyBackgroundToThemeBackgroundColor(_document, _localStorage)
}

try {
  main(document, window, localStorage)
} catch (error) {
  console.error("[vscode] failed to initialize VS Code")
  console.error(error)
}
