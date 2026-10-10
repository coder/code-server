import { CapacitorConfig } from "@capacitor/cli"

// This app is a thin WebView wrapper. It does not bundle code-server or Node.
// It loads a code-server instance that is already running on the device
// (for example in Termux) at http://127.0.0.1:8080.
const config: CapacitorConfig = {
  appId: "com.coder.codeserver",
  appName: "code-server",
  webDir: "www",
  server: {
    url: "http://127.0.0.1:8080",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
