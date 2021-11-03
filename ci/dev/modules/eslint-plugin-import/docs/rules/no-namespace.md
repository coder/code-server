# import/no-namespace

Enforce a convention of not using namespace (a.k.a. "wildcard" `*`) imports.

+(fixable) The `--fix` option on the [command line] automatically fixes problems reported by this rule, provided that the namespace object is only used for direct member access, e.g. `namespace.a`.
The `--fix` functionality for this rule requires ESLint 5 or newer.

## Rule Details

Valid:

```js
import defaultExport from './foo'
import { a, b }  from './bar'
import defaultExport, { a, b }  from './foobar'
```

Invalid:

```js
import * as foo from 'foo';
```

```js
import defaultExport, * as foo from 'foo';
```

## When Not To Use It

If you want to use namespaces, you don't want to use this rule.
