# Specificity Calculator

A JavaScript module for calculating and comparing the [specificity of CSS selectors](https://www.w3.org/TR/selectors-3/#specificity). The module is used on the [Specificity Calculator](https://specificity.keegan.st/) website.

Specificity Calculator is built for CSS Selectors Level 3. Specificity Calculator isn’t a CSS validator. If you enter invalid selectors it will return incorrect results. For example, the [negation pseudo-class](https://www.w3.org/TR/selectors-3/#negation) may only take a simple selector as an argument. Using a psuedo-element or combinator as an argument for `:not()` is invalid CSS so Specificity Calculator will return incorrect results.

## Supported runtime environments

The module is provided in two formats: an ECMAScript (ES) module in `dist/specificity.mjs`, and a Universal Module Definition (UMD) in `dist/specificity.js`. This enables support for the following runtime environments:

**Browser**

  * Directly loaded ES module
  * ES module in a precompiled script (using a bundler like Webpack or Rollup)
  * Global variable

**Node.js**

  * ES module
  * CommonJS module

### Browser usage as a directly loaded ES module

```html
<script type="module">
  import { calculate } from './specificity/dist/specificity.mjs';

  calculate('ul#nav li.active a');
</script>
```

### Browser usage as an ES module in a precompiled script

Bundlers like [Webpack and Rollup](https://github.com/rollup/rollup/wiki/pkg.module) import from the `module` field in `package.json`, which is set to the ES module artefact, `dist/specificity.mjs`.

```js
import { calculate } from 'specificity';

calculate('ul#nav li.active a');
```

### Browser usage as a global variable

The UMD artefact, `dist/specificity.js`, sets a global variable, `SPECIFICITY`.

```html
<script src="./specificity/dist/specificity.js"></script>

<script>
  SPECIFICITY.calculate('ul#nav li.active a');
</script>
```

### Node.js usage as an ES module

The `main` field in `package.json` has an extensionless value, `dist/specificity`. This allows Node.js to use either the ES module, in `dist/specificity.mjs`, or the CommonJS module, in `dist/specificity.js`.

When Node.js is run with the `--experimental-modules` [flag](https://nodejs.org/api/esm.html) or an [ES module loader](https://www.npmjs.com/package/esm), it will use the ES module artefact.

```js
import { calculate } from 'specificity';

calculate('ul#nav li.active a');
```

### Node.js usage as a CommonJS module

Otherwise, Node.js will use the UMD artefact, which contains a CommonJS module definition.

```js
const { calculate } = require('specificity');

calculate('ul#nav li.active a');
```

## Calculate function

The `calculate` function returns an array containing a result object for each selector input. Each result object has the following properties:

  * `selector`: the input
  * `specificity`: the result as a string e.g. `0,1,0,0`
  * `specificityArray`: the result as an array of numbers e.g. `[0, 1, 0, 0]`
  * `parts`: array with details about each part of the selector that counts towards the specificity

## Example

```js
calculate('ul#nav li.active a');

/*
[
  {
    selector: 'ul#nav li.active a',
    specificity: '0,1,1,3',
    specificityArray: [0, 1, 1, 3],
    parts: [
      { selector: 'ul', type: 'c', index: 0, length: 2 },
      { selector: '#nav', type: 'a', index: 2, length: 4 },
      { selector: 'li', type: 'c', index: 5, length: 2 },
      { selector: '.active', type: 'b', index: 8, length: 7 },
      { selector: 'a', type: 'c', index: 13, length: 1 }
    ]
  }
]
*/
```

You can use comma separation to pass in multiple selectors:

```js
calculate('ul#nav li.active a, body.ie7 .col_3 h2 ~ h2');

/*
[
  {
    selector: 'ul#nav li.active a',
    specificity: '0,1,1,3',
    ...
  },
  {
    selector: 'body.ie7 .col_3 h2 ~ h2',
    specificity: '0,0,2,3',
    ...
  }
]
*/
```

## Comparing two selectors

Specificity Calculator also exports a `compare` function. This function accepts two CSS selectors or specificity arrays, `a` and `b`.

  * It returns `-1` if `a` has a lower specificity than `b`
  * It returns `1` if `a` has a higher specificity than `b`
  * It returns `0` if `a` has the same specificity than `b`

```js
compare('div', '.active');            // -1
compare('#main', 'div');              // 1
compare('span', 'div');               // 0
compare('span', [0, 0, 0, 1]);        // 0
compare('#main > div', [0, 1, 0, 1]); // 0
```

## Ordering an array of selectors by specificity

You can pass the `compare` function to `Array.prototype.sort` to sort an array of CSS selectors by specificity.

```js
import { compare } from 'specificity';

['#main', 'p', '.active'].sort(compare); // ['p', '.active', '#main']
```

## Command-line usage

Run `npm install specificity` to install the module locally, or `npm install -g specificity` for global installation. Run `specificity` without arguments to learn about its usage:

```bash
$ specificity
Usage: specificity <selector>
Computes specificity of a CSS selector.
```

Pass a selector as the first argument to get its specificity computed:

```bash
$ specificity "ul#nav li.active a"
0,1,1,3
```

## Testing

To install dependencies, run: `npm install`

Then to test, run: `npm test`
