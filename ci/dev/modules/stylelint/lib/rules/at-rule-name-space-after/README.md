# at-rule-name-space-after

Require a single space after at-rule names.

<!-- prettier-ignore -->
```css
@media (max-width: 600px) {}
/**   ↑
 * The space after at-rule names */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"always-single-line"`

### `"always"`

There _must always_ be a single space after at-rule names.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@charset"UTF-8";
```

<!-- prettier-ignore -->
```css
@media(min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media  (min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media
(min-width: 700px) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";
```

<!-- prettier-ignore -->
```css
@import url("x.css");
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
```

### `"always-single-line"`

There _must always_ be a single space after at-rule names in single-line declaration blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@charset"UTF-8";
```

<!-- prettier-ignore -->
```css
@media(min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media  (min-width: 700px) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";
```

<!-- prettier-ignore -->
```css
@import url("x.css");
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media
(min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media(min-width: 700px) and
  (orientation: portrait) {}
```

<!-- prettier-ignore -->
```css
@media
  (min-width: 700px) and
  (orientation: portrait) {}
```
