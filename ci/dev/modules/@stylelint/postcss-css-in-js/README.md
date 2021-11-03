# PostCSS CSS-in-JS Syntax

[![NPM version](https://img.shields.io/npm/v/@stylelint/postcss-css-in-js.svg)](https://www.npmjs.org/package/@stylelint/postcss-css-in-js) [![Build Status](https://github.com/stylelint/postcss-css-in-js/workflows/CI/badge.svg)](https://github.com/stylelint/postcss-css-in-js/actions)

<img align="right" width="95" height="95"
	title="Philosopher’s stone, logo of PostCSS"
	src="https://api.postcss.org/logo.svg">

[PostCSS](https://github.com/postcss/postcss) syntax for parsing [CSS in JS](https://github.com/MicheleBertoli/css-in-js) literals:

- [aphrodite](https://github.com/Khan/aphrodite)
- [astroturf](https://github.com/4Catalyzer/astroturf)
- [csjs](https://github.com/rtsao/csjs)
- [css-light](https://github.com/streamich/css-light)
- [cssobj](https://github.com/cssobj/cssobj)
- [electron-css](https://github.com/azukaar/electron-css)
- [emotion](https://github.com/emotion-js/emotion)
- [freestyler](https://github.com/streamich/freestyler)
- [glamor](https://github.com/threepointone/glamor)
- [glamorous](https://github.com/paypal/glamorous)
- [j2c](https://github.com/j2css/j2c)
- [linaria](https://github.com/callstack/linaria)
- [lit-css](https://github.com/bashmish/lit-css)
- [react-native](https://github.com/necolas/react-native-web)
- [react-style](https://github.com/js-next/react-style)
- [reactcss](https://github.com/casesandberg/reactcss)
- [styled-components](https://github.com/styled-components/styled-components)
- [styletron-react](https://github.com/rtsao/styletron)
- [styling](https://github.com/andreypopp/styling)
- [typestyle](https://github.com/typestyle/typestyle)

## Getting Started

First thing's first, install the module:

```
npm install postcss-syntax @stylelint/postcss-css-in-js --save-dev
```

## Use Cases

```js
const postcss = require("postcss");
const stylelint = require("stylelint");
const syntax = require("postcss-syntax");
postcss([stylelint({ fix: true })])
  .process(source, { syntax: syntax })
  .then(function (result) {
    // An alias for the result.css property. Use it with syntaxes that generate non-CSS output.
    result.content;
  });
```

input:

```javascript
import glm from "glamorous";
const Component1 = glm.a({
  flexDirectionn: "row",
  display: "inline-block",
  color: "#fff"
});
```

output:

```javascript
import glm from "glamorous";
const Component1 = glm.a({
  color: "#fff",
  display: "inline-block",
  flexDirectionn: "row"
});
```

## Advanced Use Cases

Add support for more `css-in-js` package:

```js
const syntax = require("postcss-syntax")({
  "i-css": (index, namespace) => namespace[index + 1] === "addStyles",
  "styled-components": true
});
```

See: [postcss-syntax](https://github.com/gucong3000/postcss-syntax)

## Style Transformations

The main use case of this plugin is to apply PostCSS transformations to CSS code in template literals & styles as object literals.
