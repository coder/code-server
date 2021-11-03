# import/no-cycle

Ensures that there is no resolvable path back to this module via its dependencies.

This includes cycles of depth 1 (imported module imports me) to `"∞"` (or `Infinity`), if the
[`maxDepth`](#maxdepth) option is not set.

```js
// dep-b.js
import './dep-a.js'

export function b() { /* ... */ }
```

```js
// dep-a.js
import { b } from './dep-b.js' // reported: Dependency cycle detected.
```

This rule does _not_ detect imports that resolve directly to the linted module;
for that, see [`no-self-import`].


## Rule Details

### Options

By default, this rule only detects cycles for ES6 imports, but see the [`no-unresolved` options](./no-unresolved.md#options) as this rule also supports the same `commonjs` and `amd` flags. However, these flags only impact which import types are _linted_; the
import/export infrastructure only registers `import` statements in dependencies, so
cycles created by `require` within imported modules may not be detected.

#### `maxDepth`

There is a `maxDepth` option available to prevent full expansion of very deep dependency trees:

```js
/*eslint import/no-cycle: [2, { maxDepth: 1 }]*/

// dep-c.js
import './dep-a.js'
```

```js
// dep-b.js
import './dep-c.js'

export function b() { /* ... */ }
```

```js
// dep-a.js
import { b } from './dep-b.js' // not reported as the cycle is at depth 2
```

This is not necessarily recommended, but available as a cost/benefit tradeoff mechanism
for reducing total project lint time, if needed.

#### `ignoreExternal`

An `ignoreExternal` option is available to prevent the cycle detection to expand to external modules:

```js
/*eslint import/no-cycle: [2, { ignoreExternal: true }]*/

// dep-a.js
import 'module-b/dep-b.js'

export function a() { /* ... */ }
```

```js
// node_modules/module-b/dep-b.js
import { a } from './dep-a.js' // not reported as this module is external
```

Its value is `false` by default, but can be set to `true` for reducing total project lint time, if needed.

## When Not To Use It

This rule is comparatively computationally expensive. If you are pressed for lint
time, or don't think you have an issue with dependency cycles, you may not want
this rule enabled.

## Further Reading

- [Original inspiring issue](https://github.com/benmosher/eslint-plugin-import/issues/941)
- Rule to detect that module imports itself: [`no-self-import`]
- [`import/external-module-folders`] setting

[`no-self-import`]: ./no-self-import.md

[`import/external-module-folders`]: ../../README.md#importexternal-module-folders
