# declaration-colon-space-after

Require a single space or disallow whitespace after the colon of declarations.

<!-- prettier-ignore -->
```css
a { color: pink }
/**      ↑
 * The space after this colon */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"`

### `"always"`

There _must always_ be a single space after the colon.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color :pink }
```

<!-- prettier-ignore -->
```css
a { color:pink }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color : pink }
```

<!-- prettier-ignore -->
```css
a { color: pink }
```

### `"never"`

There _must never_ be whitespace after the colon.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color : pink }
```

<!-- prettier-ignore -->
```css
a { color: pink }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color :pink }
```

<!-- prettier-ignore -->
```css
a { color:pink }
```

### `"always-single-line"`

There _must always_ be a single space after the colon _if the declaration's value is single-line_.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  box-shadow:0 0 0 1px #5b9dd9, 0 0 2px 1px rgba(30, 140, 190, 0.8);
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  box-shadow: 0 0 0 1px #5b9dd9, 0 0 2px 1px rgba(30, 140, 190, 0.8);
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow:
    0 0 0 1px #5b9dd9,
    0 0 2px 1px rgba(30, 140, 190, 0.8);
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow:0 0 0 1px #5b9dd9,
    0 0 2px 1px rgba(30, 140, 190, 0.8);
}
```
