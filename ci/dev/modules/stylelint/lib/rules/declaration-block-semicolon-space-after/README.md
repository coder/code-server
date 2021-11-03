# declaration-block-semicolon-space-after

Require a single space or disallow whitespace after the semicolons of declaration blocks.

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
/**            ↑
 * The space after this semicolon */
```

This rule ignores:

- semicolons that are preceded by Less mixins
- the last semicolon of declaration blocks

Use the `block-closing-brace-*-before` rules to control the whitespace between the last semicolon and the closing brace instead.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space after the semicolon.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;top: 0; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink;
  top: 0;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;}
```

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
```

### `"never"`

There _must never_ be whitespace after the semicolon.

The following patterns are considered violations:

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

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;}
```

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { color: pink;top: 0; }
```

### `"always-single-line"`

There _must always_ be a single space after the semicolon in single-line declaration blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;top: 0; }
```

The following patterns are _not_ considered violations:

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

### `"never-single-line"`

There _must never_ be whitespace after the semicolon in single-line declaration blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;top: 0; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink;
  top: 0;
}
```
