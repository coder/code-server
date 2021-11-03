# declaration-block-semicolon-newline-before

Require a newline or disallow whitespace before the semicolons of declaration blocks.

<!-- prettier-ignore -->
```css
  a {
    color: pink
    ; top: 0;
  } ↑
/** ↑
 * The newline before this semicolon */
```

This rule ignores semicolons that are preceded by Less mixins.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline before the semicolons.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink; top: 0;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink
; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink
  ; top: 0;
}
```

### `"always-multi-line"`

There _must always_ be a newline before the semicolons in multi-line rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink; top: 0;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink
  ; top: 0;
}
```

### `"never-multi-line"`

There _must never_ be whitespace before the semicolons in multi-line rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink
  ; top: 0;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink;
  top: 0;
}
```
