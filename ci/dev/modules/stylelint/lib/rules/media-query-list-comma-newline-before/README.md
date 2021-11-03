# media-query-list-comma-newline-before

Require a newline or disallow whitespace before the commas of media query lists.

<!-- prettier-ignore -->
```css
    @media screen and (color)
    , projection and (color) {}
/** ↑
 * This comma */
```

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline before the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color),
projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,
projection and (color) {}
```

### `"always-multi-line"`

There _must always_ be a newline before the commas in multi-line media query lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color),
projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,
projection and (color) {}
```

### `"never-multi-line"`

There _must never_ be whitespace before the commas in multi-line media query lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color)
,projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color)
,
projection and (color) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (color), projection and (color) {}
```

<!-- prettier-ignore -->
```css
@media screen and (color),
projection and (color) {}
```
