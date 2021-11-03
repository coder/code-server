# Disallows invocation of `require()` (`no-require-imports`)

Prefer the newer ES6-style imports over `require()`.

## Rule Details

Examples of **incorrect** code for this rule:

```ts
var lib = require('lib');
let lib2 = require('lib2');
var lib5 = require('lib5'),
  lib6 = require('lib6');
import lib8 = require('lib8');
```

Examples of **correct** code for this rule:

```ts
import { l } from 'lib';
var lib3 = load('not_an_import');
var lib4 = lib2.subImport;
var lib7 = 700;
import lib9 = lib2.anotherSubImport;
import lib10 from 'lib10';
```

## When Not To Use It

If you don't care about TypeScript module syntax, then you will not need this rule.

## Compatibility

- TSLint: [no-require-imports](https://palantir.github.io/tslint/rules/no-require-imports/)
