<h1 align="center">TypeScript ESLint Parser</h1>

<p align="center">An ESLint parser which leverages <a href="https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/typescript-estree">TypeScript ESTree</a> to allow for ESLint to lint TypeScript source code.</p>

<p align="center">
    <img src="https://github.com/typescript-eslint/typescript-eslint/workflows/CI/badge.svg" alt="CI" />
    <a href="https://www.npmjs.com/package/@typescript-eslint/parser"><img src="https://img.shields.io/npm/v/@typescript-eslint/parser.svg?style=flat-square" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/package/@typescript-eslint/parser"><img src="https://img.shields.io/npm/dm/@typescript-eslint/parser.svg?style=flat-square" alt="NPM Downloads" /></a>
</p>

## Getting Started

**[You can find our Getting Started docs here](../../docs/getting-started/linting/README.md)**

These docs walk you through setting up ESLint, this parser, and our plugin. If you know what you're doing and just want to quick start, read on...

## Quick-start

### Installation

```bash
$ yarn add -D typescript @typescript-eslint/parser
$ npm i --save-dev typescript @typescript-eslint/parser
```

### Usage

In your ESLint configuration file, set the `parser` property:

```json
{
  "parser": "@typescript-eslint/parser"
}
```

There is sometimes an incorrect assumption that the parser itself is what does everything necessary to facilitate the use of ESLint with TypeScript. In actuality, it is the combination of the parser _and_ one or more plugins which allow you to maximize your usage of ESLint with TypeScript.

For example, once this parser successfully produces an AST for the TypeScript source code, it might well contain some information which simply does not exist in a standard JavaScript context, such as the data for a TypeScript-specific construct, like an `interface`.

The core rules built into ESLint, such as `indent` have no knowledge of such constructs, so it is impossible to expect them to work out of the box with them.

Instead, you also need to make use of one more plugins which will add or extend rules with TypeScript-specific features.

By far the most common case will be installing the [`@typescript-eslint/eslint-plugin`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) plugin, but there are also other relevant options available such a [`@typescript-eslint/eslint-plugin-tslint`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin-tslint).

## Configuration

The following additional configuration options are available by specifying them in [`parserOptions`](https://eslint.org/docs/user-guide/configuring/language-options#specifying-parser-options) in your ESLint configuration file.

```ts
interface ParserOptions {
  ecmaFeatures?: {
    jsx?: boolean;
    globalReturn?: boolean;
  };
  ecmaVersion?: number;

  jsxPragma?: string;
  jsxFragmentName?: string | null;
  lib?: string[];

  project?: string | string[];
  projectFolderIgnoreList?: string[];
  tsconfigRootDir?: string;
  extraFileExtensions?: string[];
  warnOnUnsupportedTypeScriptVersion?: boolean;

  program?: import('typescript').Program;
}
```

### `parserOptions.ecmaFeatures.jsx`

Default `false`.

Enable parsing JSX when `true`. More details can be found [here](https://www.typescriptlang.org/docs/handbook/jsx.html).

**NOTE:** this setting does not affect known file types (`.js`, `.jsx`, `.ts`, `.tsx`, `.json`) because the TypeScript compiler has its own internal handling for known file extensions. The exact behavior is as follows:

- if `parserOptions.project` is _not_ provided:
  - `.js`, `.jsx`, `.tsx` files are parsed as if this is true.
  - `.ts` files are parsed as if this is false.
  - unknown extensions (`.md`, `.vue`) will respect this setting.
- if `parserOptions.project` is provided (i.e. you are using rules with type information):
  - `.js`, `.jsx`, `.tsx` files are parsed as if this is true.
  - `.ts` files are parsed as if this is false.
  - "unknown" extensions (`.md`, `.vue`) **are parsed as if this is false**.

### `parserOptions.ecmaFeatures.globalReturn`

Default `false`.

This options allows you to tell the parser if you want to allow global `return` statements in your codebase.

### `parserOptions.ecmaVersion`

Default `2018`.

Accepts any valid ECMAScript version number:

- A version: es3, es5, es6, es7, es8, es9, es10, es11, ..., or
- A year: es2015, es2016, es2017, es2018, es2019, es2020, ...

The value **must** be a number - so do not include the `es` prefix.

Specifies the version of ECMAScript syntax you want to use. This is used by the parser to determine how to perform scope analysis, and it affects the default

### `parserOptions.jsxPragma`

Default `'React'`

The identifier that's used for JSX Elements creation (after transpilation).
If you're using a library other than React (like `preact`), then you should change this value.

This should not be a member expression - just the root identifier (i.e. use `"React"` instead of `"React.createElement"`).

If you provide `parserOptions.project`, you do not need to set this, as it will automatically detected from the compiler.

### `parserOptions.jsxFragmentName`

Default `null`

The identifier that's used for JSX fragment elements (after transpilation).
If `null`, assumes transpilation will always use a member of the configured `jsxPragma`.
This should not be a member expression - just the root identifier (i.e. use `"h"` instead of `"h.Fragment"`).

If you provide `parserOptions.project`, you do not need to set this, as it will automatically detected from the compiler.

### `parserOptions.lib`

Default `['es2018']`

For valid options, see the [TypeScript compiler options](https://www.typescriptlang.org/tsconfig#lib).

Specifies the TypeScript `lib`s that are available. This is used by the scope analyser to ensure there are global variables declared for the types exposed by TypeScript.

If you provide `parserOptions.project`, you do not need to set this, as it will automatically detected from the compiler.

### `parserOptions.project`

Default `undefined`.

This option allows you to provide a path to your project's `tsconfig.json`. **This setting is required if you want to use rules which require type information**. Relative paths are interpreted relative to the current working directory if `tsconfigRootDir` is not set. If you intend on running ESLint from directories other than the project root, you should consider using `tsconfigRootDir`.

- Accepted values:

  ```js
  // path
  project: './tsconfig.json';

  // glob pattern
  project: './packages/**/tsconfig.json';

  // array of paths and/or glob patterns
  project: ['./packages/**/tsconfig.json', './separate-package/tsconfig.json'];
  ```

- If you use project references, TypeScript will not automatically use project references to resolve files. This means that you will have to add each referenced tsconfig to the `project` field either separately, or via a glob.

- TypeScript will ignore files with duplicate filenames in the same folder (for example, `src/file.ts` and `src/file.js`). TypeScript purposely ignore all but one of the files, only keeping the one file with the highest priority extension (the extension priority order (from highest to lowest) is `.ts`, `.tsx`, `.d.ts`, `.js`, `.jsx`). For more info see #955.

- Note that if this setting is specified and `createDefaultProgram` is not, you must only lint files that are included in the projects as defined by the provided `tsconfig.json` files. If your existing configuration does not include all of the files you would like to lint, you can create a separate `tsconfig.eslint.json` as follows:

  ```jsonc
  {
    // extend your base config so you don't have to redefine your compilerOptions
    "extends": "./tsconfig.json",
    "include": [
      "src/**/*.ts",
      "test/**/*.ts",
      "typings/**/*.ts",
      // etc

      // if you have a mixed JS/TS codebase, don't forget to include your JS files
      "src/**/*.js"
    ]
  }
  ```

### `parserOptions.tsconfigRootDir`

Default `undefined`.

This option allows you to provide the root directory for relative tsconfig paths specified in the `project` option above.

### `parserOptions.projectFolderIgnoreList`

Default `["**/node_modules/**"]`.

This option allows you to ignore folders from being included in your provided list of `project`s.
This is useful if you have configured glob patterns, but want to make sure you ignore certain folders.

It accepts an array of globs to exclude from the `project` globs.

For example, by default it will ensure that a glob like `./**/tsconfig.json` will not match any `tsconfig`s within your `node_modules` folder (some npm packages do not exclude their source files from their published packages).

### `parserOptions.extraFileExtensions`

Default `undefined`.

This option allows you to provide one or more additional file extensions which should be considered in the TypeScript Program compilation.
The default extensions are `.ts`, `.tsx`, `.js`, and `.jsx`. Add extensions starting with `.`, followed by the file extension. E.g. for a `.vue` file use `"extraFileExtensions: [".vue"]`.

### `parserOptions.warnOnUnsupportedTypeScriptVersion`

Default `true`.

This option allows you to toggle the warning that the parser will give you if you use a version of TypeScript which is not explicitly supported

### `parserOptions.createDefaultProgram`

Default `false`.

This option allows you to request that when the `project` setting is specified, files will be allowed when not included in the projects defined by the provided `tsconfig.json` files. **Using this option will incur significant performance costs. This option is primarily included for backwards-compatibility.** See the **`project`** section above for more information.

### `parserOptions.programs`

Default `undefined`.

This option allows you to programmatically provide an array of one or more instances of a TypeScript Program object that will provide type information to rules.
This will override any programs that would have been computed from `parserOptions.project` or `parserOptions.createDefaultProgram`.
All linted files must be part of the provided program(s).

## Utilities

### `createProgram(configFile, projectDirectory)`

This serves as a utility method for users of the `parserOptions.programs` feature to create a TypeScript program instance from a config file.

```ts
declare function createProgram(
  configFile: string,
  projectDirectory?: string,
): import('typescript').Program;
```

Example usage in .eslintrc.js:

```js
const parser = require('@typescript-eslint/parser');
const programs = [parser.createProgram('tsconfig.json')];
module.exports = {
  parserOptions: {
    programs,
  },
};
```

## Supported TypeScript Version

Please see [`typescript-eslint`](https://github.com/typescript-eslint/typescript-eslint) for the supported TypeScript version.

**Please ensure that you are using a supported version before submitting any issues/bug reports.**

## Reporting Issues

Please use the `@typescript-eslint/parser` issue template when creating your issue and fill out the information requested as best you can. This will really help us when looking into your issue.

## License

TypeScript ESLint Parser is licensed under a permissive BSD 2-clause license.

## Contributing

[See the contributing guide here](../../CONTRIBUTING.md)
