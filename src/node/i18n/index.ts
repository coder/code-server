import i18next, { init } from "i18next"
import * as en from "./locales/en.json"
import * as ja from "./locales/ja.json"
import * as th from "./locales/th.json"
import * as ur from "./locales/ur.json"
import * as zhCn from "./locales/zh-cn.json"

init({
  lng: "en",
  fallbackLng: "en", // language to use if translations in user language are not available.
  returnNull: false,
  lowerCaseLng: true,
  debug: process.env.NODE_ENV === "development",
  resources: {
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
  },
})

export default i18next
