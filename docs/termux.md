<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Termux

- [Install](#install)
- [Upgrade](#upgrade)
- [Known Issues](#known-issues)
  - [Search doesn't work](#search-doesnt-work)
  - [Backspace doesn't work](#backspace-doesnt-work)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Termux is a terminal application and Linux environment that you can also use to
run code-server from your Android phone.

## Install

1. Install Termux from [F-Droid](https://f-droid.org/en/packages/com.termux/).
1. Make sure it's up-to-date: `apt update && apt upgrade`
1. Install required packages: `apt install build-essential python git nodejs yarn`
1. Install code-server: `yarn global add code-server`
1. Run code-server: `code-server` and navigate to localhost:8080 in your browser

## Upgrade

To upgrade run: `yarn global upgrade code-server --latest`

## Known Issues

The following details known issues and suggested workarounds for using
code-server with Termux.

### Search doesn't work

There is a known issue with search not working on Android because it's missing
`bin/rg` ([context](https://github.com/cdr/code-server/issues/1730#issuecomment-721515979)). To fix this:

1. Install `ripgrep` with `pkg`

   ```sh
   pkg install ripgrep
   ```

1. Make a soft link using `ln -s`

   ```sh
   # run this command inside the code-server directory
   ln -s $PREFIX/bin/rg ./lib/vscode/node_modules/vscode-ripgrep/bin/rg
   ```

### Backspace doesn't work

When using Android's on-screen keyboard, the backspace key doesn't work
properly. This is a known upstream issue:

- [Issues with backspace in Codespaces on Android (Surface Duo)](https://github.com/microsoft/vscode/issues/107602)
- [Support mobile platforms](https://github.com/xtermjs/xterm.js/issues/1101)

There are two workarounds.

**Option 1:** Modify keyboard dispatch settings

1. Open the Command Palette
2. Search for **Preferences: Open Settings (JSON)**
3. Add `"keyboard.dispatch": "keyCode"`

The backspace button should work at this point.

_Thanks to @Nefomemes for the [suggestion](https://github.com/cdr/code-server/issues/1141#issuecomment-789463707)!_

**Option 2:** Use a Bluetooth keyboard.
