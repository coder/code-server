import { promises as fs } from "fs"
import i18next, { init } from "i18next"
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

export async function loadCustomStrings(filePath: string): Promise<void> {
  try {
    // Read custom strings from file path only
    const fileContent = await fs.readFile(filePath, "utf8")
    const customStringsData = JSON.parse(fileContent)

    // User-provided strings override all languages.
    Object.keys(defaultResources).forEach((locale) => {
      i18next.addResourceBundle(locale, "translation", customStringsData)
    })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`Custom strings file not found: ${filePath}\nPlease ensure the file exists and is readable.`)
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in custom strings file: ${filePath}\n${error.message}`)
    } else {
      throw new Error(
        `Failed to load custom strings from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
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
