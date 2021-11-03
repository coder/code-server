# at-rule-name-newline-after

Require a newline after at-rule names.

<!-- prettier-ignore -->
```css
    @media
   /*↑*/  (max-width: 600px) {}
/**  ↑
 * The newline after this at-rule name */
```

## Options

`string`: `"always"|"always-multi-line"`

### `"always"`

There _must always_ be a newline after at-rule names.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and
  (orientation: landscape) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset
  "UTF-8";
```

<!-- prettier-ignore -->
```css
@import
  "x.css" screen and
 (orientation:landscape);
```

<!-- prettier-ignore -->
```css
@media
  (min-width: 700px) and (orientation: landscape) {}
```

<!-- prettier-ignore -->
```css
@media
  (min-width: 700px) and
  (orientation: landscape) {}
```

### `"always-multi-line"`

There _must always_ be a newline after at-rule names in at-rules with multi-line parameters.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@import "x.css" screen and
 (orientation:landscape);
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and
 (orientation: landscape) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";
```

<!-- prettier-ignore -->
```css
@charset
  "UTF-8";
```

<!-- prettier-ignore -->
```css
@import "x.css" screen and (orientation:landscape);
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and (orientation: landscape) {}
```

<!-- prettier-ignore -->
```css
@media
  (min-width: 700px) and
  (orientation: landscape) {}
```
