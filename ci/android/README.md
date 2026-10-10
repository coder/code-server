# Android WebView wrapper

A minimal [Capacitor](https://capacitorjs.com) app that opens a code-server
instance running on the same device (for example in
[Termux](../../docs/termux.md)) inside a WebView.

It does **not** bundle Node.js or code-server, so none of the Node.js Mobile
API limitations apply. code-server runs as a normal process in Termux and
terminals, language servers, and sockets behave as they do on any Linux system.

See [docs/android-webview.md](../../docs/android-webview.md) for usage.

## Build locally

Requires Node.js, JDK 17, and the Android SDK.

```shell
cd ci/android
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

The same steps run in the `Build Android WebView APK` GitHub workflow.
