# at-rule-semicolon-space-before

Require a single space or disallow whitespace before the semicolons of at-rules.

<!-- prettier-ignore -->
```css
@import "components/buttons";
/**                         ↑
 * The space before this semicolon */
```

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the semicolons.

The following pattern is considered a violation:

<!-- prettier-ignore -->
```css
@import "components/buttons";
```

The following pattern is _not_ considered a violation:

<!-- prettier-ignore -->
```css
@import "components/buttons" ;
```

### `"never"`

There _must never_ be a single space before the semicolons.

The following pattern is considered a violation:

<!-- prettier-ignore -->
```css
@import "components/buttons" ;
```

The following pattern is _not_ considered a violation:

<!-- prettier-ignore -->
```css
@import "components/buttons";
```
