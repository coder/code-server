<p align="center">
  <img src="https://raw.githubusercontent.com/rx-ts/prettier/master/assets/sh.png" height="100" />
</p>

# prettier-plugin-sh ![npm bundle size](https://img.shields.io/bundlephobia/min/prettier-plugin-sh) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/prettier-plugin-sh)

> An opinionated `shellscript、Dockerfile、properties、gitignore、dotenv、hosts、jvmoptions...` formatter plugin for [Prettier][]

Prettier is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing, taking various rules into account.

This plugin adds support for a lot of files through [mvdan-sh][].

## Notice

This plugin is still under development, its printer just wraps [mvdan-sh][]'s default printer.
Of course it should just work, but may not match [prettier][]'s format sometimes.

## Requirements

`prettier-plugin-sh` is an evergreen module. 🌲 This module requires an [LTS](https://github.com/nodejs/Release) Node version (v12.0.0+).

## Install

Using npm:

```sh
# npm
npm i -D prettier prettier-plugin-sh

# yarn
yarn add -D prettier prettier-plugin-sh
```

## Usage

Once installed, [Prettier plugins](https://prettier.io/docs/en/plugins.html) should be automatically recognized by Prettier. To use this plugin, confirm that it's installed and run Prettier using your preferred method. For example:

```sh
# npx
npx prettier --write script.sh

# yarn
yarn prettier --write script.sh
```

## Parser Options

```ts
interface ShOptions {
  // parser
  keepComments: boolean // default `true`
  stopAt: string
  variant: LangVariant

  // printer
  indent: number
  binaryNextLine: boolean // default `true`
  switchCaseIndent: boolean
  spaceRedirects: boolean
  keepPadding: boolean
  minify: boolean
  functionNextLine: boolean
}
```

More details on [godoc](https://godoc.org/mvdan.cc/sh/syntax#NewParser)

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT][] © [JounQin][]@[1stG.me][]

[1stg.me]: https://www.1stg.me
[jounqin]: https://GitHub.com/JounQin
[mit]: http://opensource.org/licenses/MIT
[mvdan-sh]: https://github.com/mvdan/sh
[prettier]: https://prettier.io
