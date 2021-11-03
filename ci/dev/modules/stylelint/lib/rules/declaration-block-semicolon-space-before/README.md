# declaration-block-semicolon-space-before

Require a single space or disallow whitespace before the semicolons of declaration blocks.

<!-- prettier-ignore -->
```css
a { color: pink; }
/**            ↑
 * The space before this semicolon */
```

This rule ignores semicolons that are preceded by Less mixins.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space before the semicolons.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink ; }
```

<!-- prettier-ignore -->
```css
a { color: pink ; top: 0 ; }
```

### `"never"`

There _must never_ be whitespace before the semicolons.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink ; }
```

<!-- prettier-ignore -->
```css
a { color: pink ; top: 0 ; }
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

### `"always-single-line"`

There _must always_ be a single space before the semicolons in single-line declaration blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink ; }
```

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
```

<!-- prettier-ignore -->
```css
a { color: pink ; top: 0 ; }
```

### `"never-single-line"`

There _must never_ be whitespace before the semicolons in single-line declaration blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink ; }
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
a { color: pink ; top: 0 ; }
```
