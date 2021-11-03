# import/order: Enforce a convention in module import order

Enforce a convention in the order of `require()` / `import` statements.
+(fixable) The `--fix` option on the [command line] automatically fixes problems reported by this rule.

With the [`groups`](#groups-array) option set to `["builtin", "external", "internal", "parent", "sibling", "index", "object"]` the order is as shown in the following example:

```js
// 1. node "builtin" modules
import fs from 'fs';
import path from 'path';
// 2. "external" modules
import _ from 'lodash';
import chalk from 'chalk';
// 3. "internal" modules
// (if you have configured your path or webpack to handle your internal paths differently)
import foo from 'src/foo';
// 4. modules from a "parent" directory
import foo from '../foo';
import qux from '../../foo/qux';
// 5. "sibling" modules from the same or a sibling's directory
import bar from './bar';
import baz from './bar/baz';
// 6. "index" of the current directory
import main from './';
// 7. "object"-imports (only available in TypeScript)
import log = console.log;
// 8. "type" imports (only available in Flow and TypeScript)
import type { Foo } from 'foo';
```

Unassigned imports are ignored, as the order they are imported in may be important.

Statements using the ES6 `import` syntax must appear before any `require()` statements.


## Fail

```js
import _ from 'lodash';
import path from 'path'; // `path` import should occur before import of `lodash`

// -----

var _ = require('lodash');
var path = require('path'); // `path` import should occur before import of `lodash`

// -----

var path = require('path');
import foo from './foo'; // `import` statements must be before `require` statement
```


## Pass

```js
import path from 'path';
import _ from 'lodash';

// -----

var path = require('path');
var _ = require('lodash');

// -----

// Allowed as ̀`babel-register` is not assigned.
require('babel-register');
var path = require('path');

// -----

// Allowed as `import` must be before `require`
import foo from './foo';
var path = require('path');
```

## Options

This rule supports the following options:

### `groups: [array]`:

How groups are defined, and the order to respect. `groups` must be an array of `string` or [`string`]. The only allowed `string`s are:
`"builtin"`, `"external"`, `"internal"`, `"unknown"`, `"parent"`, `"sibling"`, `"index"`, `"object"`, `"type"`.
The enforced order is the same as the order of each element in a group. Omitted types are implicitly grouped together as the last element. Example:
```js
[
  'builtin', // Built-in types are first
  ['sibling', 'parent'], // Then sibling and parent types. They can be mingled together
  'index', // Then the index file
  'object',
  // Then the rest: internal and external type
]
```
The default value is `["builtin", "external", "parent", "sibling", "index"]`.

You can set the options like this:

```js
"import/order": ["error", {"groups": ["index", "sibling", "parent", "internal", "external", "builtin", "object", "type"]}]
```

### `pathGroups: [array of objects]`:

To be able to group by paths mostly needed with aliases pathGroups can be defined.

Properties of the objects

| property       | required | type   | description   |
|----------------|:--------:|--------|---------------|
| pattern        |     x    | string | minimatch pattern for the paths to be in this group (will not be used for builtins or externals) |
| patternOptions |          | object | options for minimatch, default: { nocomment: true } |
| group          |     x    | string | one of the allowed groups, the pathGroup will be positioned relative to this group |
| position       |          | string | defines where around the group the pathGroup will be positioned, can be 'after' or 'before', if not provided pathGroup will be positioned like the group |

```json
{
  "import/order": ["error", {
    "pathGroups": [
      {
        "pattern": "~/**",
        "group": "external"
      }
    ]
  }]
}
```

### `pathGroupsExcludedImportTypes: [array]`:

This defines import types that are not handled by configured pathGroups.
This is mostly needed when you want to handle path groups that look like external imports.

Example:
```json
{
  "import/order": ["error", {
    "pathGroups": [
      {
        "pattern": "@app/**",
        "group": "external",
        "position": "after"
      }
    ],
    "pathGroupsExcludedImportTypes": ["builtin"]
  }]
}
```
The default value is `["builtin", "external"]`.

### `newlines-between: [ignore|always|always-and-inside-groups|never]`:

Enforces or forbids new lines between import groups:

- If set to `ignore`, no errors related to new lines between import groups will be reported (default).
- If set to `always`, at least one new line between each group will be enforced, and new lines inside a group will be forbidden. To prevent multiple lines between imports, core `no-multiple-empty-lines` rule can be used.
- If set to `always-and-inside-groups`, it will act like `always` except newlines are allowed inside import groups.
- If set to `never`, no new lines are allowed in the entire import section.

With the default group setting, the following will be invalid:

```js
/* eslint import/order: ["error", {"newlines-between": "always"}] */
import fs from 'fs';
import path from 'path';
import index from './';
import sibling from './foo';
```

```js
/* eslint import/order: ["error", {"newlines-between": "always-and-inside-groups"}] */
import fs from 'fs';

import path from 'path';
import index from './';
import sibling from './foo';
```

```js
/* eslint import/order: ["error", {"newlines-between": "never"}] */
import fs from 'fs';
import path from 'path';

import index from './';

import sibling from './foo';
```

while those will be valid:

```js
/* eslint import/order: ["error", {"newlines-between": "always"}] */
import fs from 'fs';
import path from 'path';

import index from './';

import sibling from './foo';
```

```js
/* eslint import/order: ["error", {"newlines-between": "always-and-inside-groups"}] */
import fs from 'fs';

import path from 'path';

import index from './';

import sibling from './foo';
```

```js
/* eslint import/order: ["error", {"newlines-between": "never"}] */
import fs from 'fs';
import path from 'path';
import index from './';
import sibling from './foo';
```

### `alphabetize: {order: asc|desc|ignore, caseInsensitive: true|false}`:

Sort the order within each group in alphabetical manner based on **import path**:

- `order`: use `asc` to sort in ascending order, and `desc` to sort in descending order (default: `ignore`).
- `caseInsensitive`: use `true` to ignore case, and `false` to consider case (default: `false`).

Example setting:
```js
alphabetize: {
  order: 'asc', /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */
  caseInsensitive: true /* ignore case. Options: [true, false] */
}
```

This will fail the rule check:

```js
/* eslint import/order: ["error", {"alphabetize": {"order": "asc", "caseInsensitive": true}}] */
import React, { PureComponent } from 'react';
import aTypes from 'prop-types';
import { compose, apply } from 'xcompose';
import * as classnames from 'classnames';
import blist from 'BList';
```

While this will pass:

```js
/* eslint import/order: ["error", {"alphabetize": {"order": "asc", "caseInsensitive": true}}] */
import blist from 'BList';
import * as classnames from 'classnames';
import aTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose, apply } from 'xcompose';
```

### `warnOnUnassignedImports: true|false`:

* default: `false`

Warns when unassigned imports are out of order.  These warning will not be fixed
with `--fix` because unassigned imports are used for side-effects and changing the
import of order of modules with side effects can not be done automatically in a
way that is safe.

This will fail the rule check:

```js
/* eslint import/order: ["error", {"warnOnUnassignedImports": true}] */
import fs from 'fs';
import './styles.css';
import path from 'path';
```

While this will pass:

```js
/* eslint import/order: ["error", {"warnOnUnassignedImports": true}] */
import fs from 'fs';
import path from 'path';
import './styles.css';
```

## Related

- [`import/external-module-folders`] setting

- [`import/internal-regex`] setting

[`import/external-module-folders`]: ../../README.md#importexternal-module-folders

[`import/internal-regex`]: ../../README.md#importinternal-regex
