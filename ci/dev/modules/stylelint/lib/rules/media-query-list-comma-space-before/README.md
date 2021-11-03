# media-query-list-comma-space-before

Require a single space or disallow whitespace before the commas of media query lists.

<!-- prettier-ignore -->
```css
@media screen and (color) ,projection and (color) {}
/**                       ↑
 * The space before this comma */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space before the commas.

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
@media screen and (color) ,projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color) ,
projection and (color) {}
```

### `"never"`

There _must never_ be whitespace before the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color) ,projection and (color) {}
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
@media screen and (color),
projection and (color) {}
```

### `"always-single-line"`

There _must always_ be a single space before the commas in single-line media query lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color),projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color) ,projection and (color) {}
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

There _must never_ be whitespace before the commas in single-line media query lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color) , projection and (color) {}
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
