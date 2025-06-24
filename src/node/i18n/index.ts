import i18next, { init } from "i18next"
import { promises as fs } from "fs"
import * as en from "./locales/en.json"
import * as ja from "./locales/ja.json"
import * as th from "./locales/th.json"
import * as ur from "./locales/ur.json"
import * as zhCn from "./locales/zh-cn.json"

const defaultResources = {
  en: {
    translation: en,
  },
  "zh-cn": {
    translation: zhCn,
  },
  th: {
    translation: th,
  },
  ja: {
    translation: ja,
  },
  ur: {
    translation: ur,
  },
}


export async function loadCustomStrings(customStringsArg: string): Promise<void> {

  try {
    let customStringsData: Record<string, any>

    // Try to parse as JSON first
    try {
      customStringsData = JSON.parse(customStringsArg)
    } catch {
      // If JSON parsing fails, treat as file path
      const fileContent = await fs.readFile(customStringsArg, "utf8")
      customStringsData = JSON.parse(fileContent)
    }

    // User-provided strings override all languages.
    Object.keys(defaultResources).forEach((locale) => {
      i18next.addResourceBundle(locale, "translation", customStringsData)
    })
  } catch (error) {
    throw new Error(`Failed to load custom strings: ${error instanceof Error ? error.message : String(error)}`)
  }
}

init({
  lng: "en",
  fallbackLng: "en", // language to use if translations in user language are not available.
  returnNull: false,
  lowerCaseLng: true,
  debug: process.env.NODE_ENV === "development",
  resources: defaultResources,
})

export default i18next
