# eslint-plugin-prettier [![Build Status](https://github.com/prettier/eslint-plugin-prettier/workflows/CI/badge.svg?branch=master)](https://github.com/prettier/eslint-plugin-prettier/actions?query=workflow%3ACI+branch%3Amaster)

Runs [Prettier](https://github.com/prettier/prettier) as an [ESLint](http://eslint.org) rule and reports differences as individual ESLint issues.

If your desired formatting does not match Prettier’s output, you should use a different tool such as [prettier-eslint](https://github.com/prettier/prettier-eslint) instead.

Please read [Integrating with linters](https://prettier.io/docs/en/integrating-with-linters.html) before installing.

## Sample

```js
error: Insert `,` (prettier/prettier) at pkg/commons-atom/ActiveEditorRegistry.js:22:25:
  20 | import {
  21 |   observeActiveEditorsDebounced,
> 22 |   editorChangesDebounced
     |                         ^
  23 | } from './debounced';;
  24 |
  25 | import {observableFromSubscribeFunction} from '../commons-node/event';


error: Delete `;` (prettier/prettier) at pkg/commons-atom/ActiveEditorRegistry.js:23:21:
  21 |   observeActiveEditorsDebounced,
  22 |   editorChangesDebounced
> 23 | } from './debounced';;
     |                     ^
  24 |
  25 | import {observableFromSubscribeFunction} from '../commons-node/event';
  26 | import {cacheWhileSubscribed} from '../commons-node/observable';


2 errors found.
```

> `./node_modules/.bin/eslint --format codeframe pkg/commons-atom/ActiveEditorRegistry.js` (code from [nuclide](https://github.com/facebook/nuclide)).

## Installation

```sh
npm install --save-dev eslint-plugin-prettier
npm install --save-dev --save-exact prettier
```

**_`eslint-plugin-prettier` does not install Prettier or ESLint for you._** _You must install these yourself._

Then, in your `.eslintrc.json`:

```json
{
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

## Recommended Configuration

This plugin works best if you disable all other ESLint rules relating to code formatting, and only enable rules that detect potential bugs. (If another active ESLint rule disagrees with `prettier` about how code should be formatted, it will be impossible to avoid lint errors.) You can use [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) to disable all formatting-related ESLint rules.

This plugin ships with a `plugin:prettier/recommended` config that sets up both the plugin and `eslint-config-prettier` in one go.

1. In addition to the above installation instructions, install `eslint-config-prettier`:

   ```sh
   npm install --save-dev eslint-config-prettier
   ```

2. Then you need to add `plugin:prettier/recommended` as the _last_ extension in your `.eslintrc.json`:

   ```json
   {
     "extends": ["plugin:prettier/recommended"]
   }
   ```

   You can then set Prettier's own options inside a `.prettierrc` file.

Exactly what does `plugin:prettier/recommended` do? Well, this is what it expands to:

```json
{
  "extends": ["prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off"
  }
}
```

- `"extends": ["prettier"]` enables the config from `eslint-config-prettier`, which turns off some ESLint rules that conflict with Prettier.
- `"plugins": ["prettier"]` registers this plugin.
- `"prettier/prettier": "error"` turns on the rule provided by this plugin, which runs Prettier from within ESLint.
- `"arrow-body-style": "off"` and `"prefer-arrow-callback": "off"` turns off two ESLint core rules that unfortunately are problematic with this plugin – see the next section.

## `arrow-body-style` and `prefer-arrow-callback` issue

If you use [arrow-body-style](https://eslint.org/docs/rules/arrow-body-style) or [prefer-arrow-callback](https://eslint.org/docs/rules/prefer-arrow-callback) together with the `prettier/prettier` rule from this plugin, you can in some cases end up with invalid code due to a bug in ESLint’s autofix – see [issue #65](https://github.com/prettier/eslint-plugin-prettier/issues/65).

For this reason, it’s recommended to turn off these rules. The `plugin:prettier/recommended` config does that for you.

You _can_ still use these rules together with this plugin if you want, because the bug does not occur _all the time._ But if you do, you need to keep in mind that you might end up with invalid code, where you manually have to insert a missing closing parenthesis to get going again.

If you’re fixing large of amounts of previously unformatted code, consider temporarily disabling the `prettier/prettier` rule and running `eslint --fix` and `prettier --write` separately.

## Options

> Note: While it is possible to pass options to Prettier via your ESLint configuration file, it is not recommended because editor extensions such as `prettier-atom` and `prettier-vscode` **will** read [`.prettierrc`](https://prettier.io/docs/en/configuration.html), but **won't** read settings from ESLint, which can lead to an inconsistent experience.

- The first option:

  - An object representing [options](https://prettier.io/docs/en/options.html) that will be passed into prettier. Example:

    ```json
    "prettier/prettier": ["error", {"singleQuote": true, "parser": "flow"}]
    ```

    NB: This option will merge and override any config set with `.prettierrc` files

- The second option:

  - An object with the following options

    - `usePrettierrc`: Enables loading of the Prettier configuration file, (default: `true`). May be useful if you are using multiple tools that conflict with each other, or do not wish to mix your ESLint settings with your Prettier configuration.

      ```json
      "prettier/prettier": ["error", {}, {
        "usePrettierrc": false
      }]
      ```

    - `fileInfoOptions`: Options that are passed to [prettier.getFileInfo](https://prettier.io/docs/en/api.html#prettiergetfileinfofilepath--options) to decide whether a file needs to be formatted. Can be used for example to opt-out from ignoring files located in `node_modules` directories.

      ```json
      "prettier/prettier": ["error", {}, {
        "fileInfoOptions": {
          "withNodeModules": true
        }
      }]
      ```

- The rule is autofixable -- if you run `eslint` with the `--fix` flag, your code will be formatted according to `prettier` style.

---

## Contributing

See [CONTRIBUTING.md](https://github.com/prettier/eslint-plugin-prettier/blob/master/CONTRIBUTING.md)
