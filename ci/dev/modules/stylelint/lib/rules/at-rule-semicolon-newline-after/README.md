# at-rule-semicolon-newline-after

Require a newline after the semicolon of at-rules.

<!-- prettier-ignore -->
```css
@import url("x.css");
@import url("y.css");
/**                 ↑
 * The newline after these semicolons */
```

This rule allows an end-of-line comment followed by a newline. For example:

<!-- prettier-ignore -->
```css
@import url("x.css"); /* end-of-line comment */

a {}
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"`

### `"always"`

There _must always_ be a newline after the semicolon.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@import url("x.css"); @import url("y.css");
```

<!-- prettier-ignore -->
```css
@import url("x.css"); a {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@import url("x.css");
@import url("y.css");
```

<!-- prettier-ignore -->
```css
@import url("x.css"); /* end-of-line comment */
a {}
```

<!-- prettier-ignore -->
```css
@import url("x.css");

a {}
```
