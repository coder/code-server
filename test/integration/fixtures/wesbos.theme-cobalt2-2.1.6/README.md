# Cobalt2 Theme for VS Code

[![Version](https://vsmarketplacebadge.apphb.com/version/wesbos.theme-cobalt2.svg)](https://marketplace.visualstudio.com/items?itemName=wesbos.theme-cobalt2)

![Preview](https://raw.githubusercontent.com/wesbos/cobalt2-vscode/cobalt2-updates/images/ss.png)

# Installation

1. Open **Extensions** sidebar panel in VS Code. `View → Extensions`
2. Search for `Cobalt2` - find the one by **Wes Bos** - there are a few other half-baked ones so make sure you have the right one!
3. Click **Install** to install it.
4. Click **Reload** to reload the your editor
5. Code > Preferences > Color Theme > **Cobalt2**
6. Optional: Use the recommended settings below for best experience

## Recommended Settings

```js
{
  "workbench.colorTheme": "Cobalt2",
  // The Cursive font is operator Mono, it's $200 and you need to buy it to get the cursive
  "editor.fontFamily": "Operator Mono, Menlo, Monaco, 'Courier New', monospace",
  "editor.fontSize": 17,
  "editor.lineHeight": 25,
  "editor.letterSpacing": 0.5,
  "files.trimTrailingWhitespace": true,
  "editor.fontWeight": "400",
  "prettier.eslintIntegration": true,
  "editor.cursorStyle": "line",
  "editor.cursorWidth": 5,
  "editor.cursorBlinking": "solid",
  "editor.renderWhitespace": "all",
}
```

## Contributing

This is a bit weird, but to get some sort of live feedback for when editing a theme. Please let me know if you have a saner way of doing it

1. Open this repo in your terminal and type `npm install`
1. Start to watch for change on the repo with `npm start` - this runs a nodemon task for you and will automatically recompile any changes
1. Open this repo in VS Code
1. Open your command palette and hit type **VSIX**. Select the one that says **Extensions: Install from VSIX...**
1. Load the VSIX file that was created a few steps back
1. Set your editor to use _this_ Cobalt2 theme - it might help to change the name in package.json to something like "Cobalt2 Dev" so you can differentiate from the Cobalt2 you've installed from the marketplace. If you get confused, just delete all traces of Cobalt2 and then load the VSIX.
1. Go to the debug sidebar `View → Debug`
1. Press the green arrow beside "Launch Extension"
1. This will then open a second window.
1. Make a change, and then hit the refresh button on your debug toolbar - this is in your first editor - not the one that poped open.
1. Wait a sec, your changes should now be reflected!

Whew. Again, if you have an easier way to style these things, let me know!

## I don't like something

First, this theme is new so if something is funky, please open an issue.

These are the things we have control over. If you would like to change something, you can either open a PR and see if I'd like it added, or override the colours in your own settings.json file.

https://code.visualstudio.com/docs/getstarted/theme-color-reference

## Put Cobalt2 in other places!

- [Sublime Text](https://github.com/wesbos/cobalt2)
- [Atom](https://github.com/wesbos/Cobalt2-atom)
- [iTerm2](https://github.com/wesbos/Cobalt2-iterm)
- [Hyper Term](https://github.com/wesbos/hyperterm-cobalt2-theme)
- [Alfred](https://github.com/wesbos/Cobalt2-Alfred-Theme)
- [Slack](https://github.com/wesbos/Cobalt2-Slack)

## Thanks

Thanks to Roberto Achar for doing much of the initial porting to VS Code.
