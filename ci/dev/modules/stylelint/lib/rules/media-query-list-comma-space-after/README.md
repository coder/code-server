# media-query-list-comma-space-after

Require a single space or disallow whitespace after the commas of media query lists.

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
/**                      ↑
 * The space after this comma */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space after the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color),projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
, projection and (color) {}
```

### `"never"`

There _must never_ be whitespace after the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
, projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color),projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

### `"always-single-line"`

There _must always_ be a single space after the commas in single-line media query lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color),projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
, projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

### `"never-single-line"`

There _must never_ be whitespace after the commas in single-line media query lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color),projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
, projection and (color) {}
```
