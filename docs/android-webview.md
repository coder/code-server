# Android WebView app

A small Android app that opens a locally running code-server in a WebView, so
you get a full-screen app instead of a browser tab.

The app does **not** bundle code-server or Node.js (it does not use Node.js
Mobile). You run code-server on the device yourself, normally in
[Termux](./termux.md), where terminals, language servers, and sockets work as
on any Linux system. The app only displays `http://127.0.0.1:8080`.

## Usage

1. Install code-server in Termux by following the [Termux guide](./termux.md).
   code-server requires Node.js 24; check with `node -v`.
2. Set a password in `~/.config/code-server/config.yaml` and keep
   `auth: password`. Any app on the device can reach `127.0.0.1:8080`, so do not
   disable authentication.
3. Start code-server in Termux: `code-server`.
4. Open the app. It loads `http://127.0.0.1:8080`.

If you change the port in `bind-addr`, rebuild the app with the matching
`server.url` in [`ci/android/capacitor.config.ts`](../ci/android/capacitor.config.ts).

## Building

See [`ci/android/README.md`](../ci/android/README.md). The `Build Android
WebView APK` workflow builds a debug APK and uploads it as an artifact.
