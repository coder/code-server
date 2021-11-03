# selector-descendant-combinator-no-non-space

Disallow non-space characters for descendant combinators of selectors.

<!-- prettier-ignore -->
```css
.foo .bar .baz {}
/** ↑    ↑
* These descendant combinators */
```

This rule ensures that only a single space is used and ensures no tabs, newlines, nor multiple spaces are used for descendant combinators of selectors.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix most of the problems reported by this rule.

This rule currently ignores selectors containing comments.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
.foo  .bar {}
```

<!-- prettier-ignore -->
```css
.foo
.bar {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.foo .bar {}
```
