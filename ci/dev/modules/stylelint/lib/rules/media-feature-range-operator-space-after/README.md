# media-feature-range-operator-space-after

Require a single space or disallow whitespace after the range operator in media features.

<!-- prettier-ignore -->
```css
@media (width >= 600px) {}
/**           ↑
 * The space after this operator */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space after the range operator.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media (width>=600px) {}
```

<!-- prettier-ignore -->
```css
@media (width >=600px) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media (width>= 600px) {}
```

<!-- prettier-ignore -->
```css
@media (width >= 600px) {}
```

### `"never"`

There _must never_ be whitespace after the range operator.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media (width>= 600px) {}
```

<!-- prettier-ignore -->
```css
@media (width >= 600px) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media (width>=600px) {}
```

<!-- prettier-ignore -->
```css
@media (width >=600px) {}
```
