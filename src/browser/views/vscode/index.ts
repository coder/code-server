import { InternalNLSConfiguration } from "../../../../lib/vscode/src/vs/base/node/languagePacks"
import { getOptions } from "../../../common/util"

export type Bundles = {
  // TODO: Clarify this type.
  [name: string]: unknown[]
}

export type BundleCallback = (err: unknown | undefined, messages?: unknown[]) => void | PromiseLike<void>

export interface CodeServerNlsConfiguration extends InternalNLSConfiguration {
  loadBundle: (name: string, language: string, cb: BundleCallback) => void
}

export interface CodeServerAmdLoaderConfigurationOptions extends AMDLoader.IConfigurationOptions {
  "vs/nls": CodeServerNlsConfiguration
}

const options = getOptions()

const parseNLSConfig = (): CodeServerNlsConfiguration => {
  return JSON.parse(document.getElementById("vscode-remote-nls-configuration")!.getAttribute("data-settings")!)
}

const syncTheme = () => {
  // First attempt to parse localStorage.
  try {
    document.body.style.background = JSON.parse(localStorage.getItem("colorThemeData")!).colorMap["editor.background"]
  } catch (error) {
    // Oh well.
  }

  // Then, observe the meta theme element for changes.
  const themeElement = document.getElementById("monaco-workbench-meta-theme-color") as HTMLMetaElement

  const synchronizeTheme = () => {
    document.body.style.background = themeElement.content
  }

  const themeElementObserver = new MutationObserver(synchronizeTheme)
  themeElementObserver.observe(themeElement, { attributes: true })

  synchronizeTheme()
}

const initializeCodeServerEditor = () => {
  syncTheme()

  const nlsConfig = parseNLSConfig()

  if (nlsConfig._resolvedLanguagePackCoreLocation) {
    const bundles: Bundles = Object.create(null)

    nlsConfig.loadBundle = async (bundle, _, cb) => {
      const result = bundles[bundle]

      if (result) {
        return cb(undefined, result)
      }

      // FIXME: Only works if path separators are /.
      const path = nlsConfig._resolvedLanguagePackCoreLocation + "/" + bundle.replace(/\//g, "!") + ".nls.json"

      let body: unknown[]
      try {
        const response = await fetch(`${options.base}/vscode/resource/?path=${encodeURIComponent(path)}`)
        body = await response.json()
      } catch (error) {
        cb(error)
        return
      }

      bundles[bundle] = body
      cb(undefined, body)
    }
  }

  const amdLoaderConfig: CodeServerAmdLoaderConfigurationOptions = {
    // Without the full URL VS Code will try to load file://.
    baseUrl: `${window.location.origin}${options.base}/vscode/lib/vscode/out`,
    recordStats: true,
    paths: {
      "vscode-textmate": `../node_modules/vscode-textmate/release/main`,
      "vscode-oniguruma": `../node_modules/vscode-oniguruma/release/main`,
      xterm: `../node_modules/xterm/lib/xterm.js`,
      "xterm-addon-search": `../node_modules/xterm-addon-search/lib/xterm-addon-search.js`,
      "xterm-addon-unicode11": `../node_modules/xterm-addon-unicode11/lib/xterm-addon-unicode11.js`,
      "xterm-addon-webgl": `../node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js`,
      "semver-umd": `../node_modules/semver-umd/lib/semver-umd.js`,
      "tas-client-umd": `../node_modules/tas-client-umd/lib/tas-client-umd.js`,
      "iconv-lite-umd": `../node_modules/iconv-lite-umd/lib/iconv-lite-umd.js`,
      jschardet: `../node_modules/jschardet/dist/jschardet.min.js`,
    },
    "vs/nls": nlsConfig,
  }

  ;(self.require as any) = amdLoaderConfig
}

initializeCodeServerEditor()
