[tests]: 	https://img.shields.io/circleci/project/github/shellscape/postcss-less.svg
[tests-url]: https://circleci.com/gh/shellscape/postcss-less

[cover]: https://codecov.io/gh/shellscape/postcss-less/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/shellscape/postcss-less

[size]: https://packagephobia.now.sh/badge?p=postcss-less
[size-url]: https://packagephobia.now.sh/result?p=postcss-less

[PostCSS]: https://github.com/postcss/postcss
[PostCSS-SCSS]: https://github.com/postcss/postcss-scss
[LESS]: http://lesless.org
[Autoprefixer]: https://github.com/postcss/autoprefixer
[Stylelint]: http://stylelint.io/

# postcss-less

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]

A [PostCSS] Syntax for parsing [LESS]

_Note: This module requires Node v6.14.4+. `poscss-less` is not a LESS compiler. For compiling LESS, please use the official toolset for LESS._

## Install

Using npm:

```console
npm install postcss-less --save-dev
```

<a href="https://www.patreon.com/shellscape">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

Please consider [becoming a patron](https://www.patreon.com/shellscape) if you find this module useful.

## Usage

The most common use of `postcss-less` is for applying PostCSS transformations directly to LESS source. eg. ia theme written in LESS which uses [Autoprefixer] to add appropriate vendor prefixes.

```js
const syntax = require('postcss-less');
postcss(plugins)
  .process(lessText, { syntax: syntax })
  .then(function (result) {
    result.content // LESS with transformations
});
```

## LESS Specific Parsing

### `@import`

Parsing of LESS-specific `@import` statements and options are supported.

```less
@import (option) 'file.less';
```

The AST will contain an `AtRule` node with:

- an `import: true` property
- a `filename: <String>` property containing the imported filename
- an `options: <String>` property containing any [import options](http://lesscss.org/features/#import-atrules-feature-import-options) specified

### Inline Comments

Parsing of single-line comments in CSS is supported.

```less
:root {
    // Main theme color
    --color: red;
}
```

The AST will contain a `Comment` node with an `inline: true` property.

### Mixins

Parsing of LESS mixins is supported.

```less
.my-mixin {
  color: black;
}
```

The AST will contain an `AtRule` node with a `mixin: true` property.

#### `!important`

Mixins that declare `!important` will contain an `important: true` property on their respective node.

### Variables

Parsing of LESS variables is supported.

```less
@link-color: #428bca;
```

The AST will contain an `AtRule` node with a `variable: true` property.

_Note: LESS variables are strictly parsed - a colon (`:`) must immediately follow a variable name._

## Stringifying

To process LESS code without PostCSS transformations, custom stringifier
should be provided.

```js
const postcss = require('postcss');
const syntax = require('postcss-less');

const less = `
    // inline comment

    .container {
        .mixin-1();
        .mixin-2;
        .mixin-3 (@width: 100px) {
            width: @width;
        }
    }

    .rotation(@deg:5deg){
      .transform(rotate(@deg));
    }
`;

const result = await postcss().process(less, { syntax });

 // will contain the value of `less`
const { content } = result;
```

## Use Cases

- Lint LESS code with 3rd-party plugins.
- Apply PostCSS transformations (such as [Autoprefixer](https://github.com/postcss/autoprefixer)) directly to the LESS source code

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING)

[LICENSE (MIT)](./LICENSE)
