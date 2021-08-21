import { NLSConfiguration, InternalNLSConfiguration } from "../../../lib/vscode/src/vs/base/node/languagePacks"

import { getOptions, CoderOptions } from "../../common/util"
import { WORKBENCH_WEB_CONFIG_ID } from "../../node/constants"
import "../register"

export type NLSConfigurationWeb = NLSConfiguration | InternalNLSConfiguration

/**
 * Helper function to create the path to the bundle
 * for getNlsConfiguration.
 */
export function createBundlePath(_resolvedLanguagePackCoreLocation: string, bundle: string) {
  // NOTE@jsjoeio - this comment was here before me
  // Refers to operating systems that use a different path separator.
  // Probably just Windows but we're not sure if "/" breaks on Windows
  // so we'll leave it alone for now.
  // FIXME: Only works if path separators are /.
  return _resolvedLanguagePackCoreLocation + "/" + bundle.replace(/\//g, "!") + ".nls.json"
}

/**
 * A helper function to get the NLS Configuration settings.
 *
 * This is used by VSCode for localizations (i.e. changing
 * the display language).
 *
 * Make sure to wrap this in a try/catch block when you call it.
 **/
export function getNlsConfiguration<T extends NLSConfigurationWeb = NLSConfigurationWeb>(
  _document: Document,
  base: string,
): T {
  const errorMsgPrefix = "[vscode]"

  const workbenchElement = _document.getElementById(WORKBENCH_WEB_CONFIG_ID)
  if (!workbenchElement) {
    throw new Error(`${errorMsgPrefix} Could not find Workbench element`)
  }

  const rawWorkbenchConfig = workbenchElement.getAttribute("data-settings")
  if (!rawWorkbenchConfig) {
    throw new Error(`${errorMsgPrefix} Could not find Workbench data`)
  }

  const nlsConfiguration: T = JSON.parse(rawWorkbenchConfig).nlsConfiguration

  if (!nlsConfiguration) {
    throw new Error(`${errorMsgPrefix} Could not parse NLS config from Workbench configuration`)
  }

  if ("_resolvedLanguagePackCoreLocation" in nlsConfiguration) {
    // NOTE@jsjoeio
    // Not sure why we use Object.create(null) instead of {}
    // They are not the same
    // See: https://stackoverflow.com/a/15518712/3015595
    // We copied this from ../../../lib/vscode/src/bootstrap.js#L143
    const bundles: {
      [key: string]: string
    } = Object.create(null)

    nlsConfiguration.loadBundle = (bundle, _language, cb): void => {
      const result = bundles[bundle]
      if (result) {
        return cb(undefined, result)
      }
      // FIXME: Only works if path separators are /.
      const path = createBundlePath(nlsConfiguration._resolvedLanguagePackCoreLocation || "", bundle)
      fetch(`${base}/vscode/resource/?path=${encodeURIComponent(path)}`)
        .then((response) => response.json())
        .then((json) => {
          bundles[bundle] = json
          cb(undefined, json)
        })
        .catch(cb)
    }
  }

  return nlsConfiguration
}

type GetLoaderParams = {
  nlsConfiguration: NLSConfigurationWeb
  options: CoderOptions
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
  trustedTypesPolicy: TrustedTypePolicy | undefined
  paths: {
    [key: string]: string
  }
  "vs/nls": NLSConfigurationWeb
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
export function getConfigurationForLoader({ nlsConfiguration, options, _window }: GetLoaderParams) {
  const trustedPolicyOptions: TrustedTypePolicyOptions = {
    createScriptURL(value: string): string {
      return _createScriptURL(value, window.location.origin)
    },
  }

  const loader: Loader = {
    // Without the full URL VS Code will try to load file://.
    baseUrl: `${window.location.origin}${options.csStaticBase}/lib/vscode/out`,
    recordStats: true,
    trustedTypesPolicy: _window.trustedTypes?.createPolicy("amdLoader", trustedPolicyOptions),
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
    "vs/nls": nlsConfiguration,
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
    nlsConfiguration: nlsConfig,
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
