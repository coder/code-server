# import/max-dependencies

Forbid modules to have too many dependencies (`import` or `require` statements).

This is a useful rule because a module with too many dependencies is a code smell, and usually indicates the module is doing too much and/or should be broken up into smaller modules.

Importing multiple named exports from a single module will only count once (e.g. `import {x, y, z} from './foo'` will only count as a single dependency).

### Options

This rule takes the following option:

`max`: The maximum number of dependencies allowed. Anything over will trigger the rule. **Default is 10** if the rule is enabled and no `max` is specified.

You can set the option like this:

```js
"import/max-dependencies": ["error", {"max": 10}]
```


## Example

Given a max value of `{"max": 2}`:

### Fail

```js
import a from './a'; // 1
const b = require('./b'); // 2
import c from './c'; // 3 - exceeds max!
```

### Pass

```js
import a from './a'; // 1
const anotherA = require('./a'); // still 1
import {x, y, z} from './foo'; // 2
```

## When Not To Use It

If you don't care how many dependencies a module has.
