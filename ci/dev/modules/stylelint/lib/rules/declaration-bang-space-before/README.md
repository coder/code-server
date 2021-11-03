# declaration-bang-space-before

Require a single space or disallow whitespace before the bang of declarations.

<!-- prettier-ignore -->
```css
a { color: pink !important; }
/**             ↑
 * The space before this exclamation mark */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the bang.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink!important; }
```

<!-- prettier-ignore -->
```css
a { color: pink  ! important; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink !important; }
```

<!-- prettier-ignore -->
```css
a { color:pink ! important; }
```

### `"never"`

There _must never_ be whitespace before the bang.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color : pink !important; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink!important; }
```

<!-- prettier-ignore -->
```css
a { color: pink! important; }
```
