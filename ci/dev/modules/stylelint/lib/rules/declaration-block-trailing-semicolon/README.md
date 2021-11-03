# declaration-block-trailing-semicolon

Require or disallow a trailing semicolon within declaration blocks.

<!-- prettier-ignore -->
```css
a { background: orange; color: pink; }
/**                                ↑
 *                    This semicolon */
```

The trailing semicolon is the _last_ semicolon in a declaration block and it is optional.

This rule ignores:

- Less mixins
- trailing `//` comments
- declaration blocks containing nested (at-)rules

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a trailing semicolon.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink }
```

<!-- prettier-ignore -->
```css
a { background: orange; color: pink }
```

<!-- prettier-ignore -->
```css
a { @include foo }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { background: orange; color: pink; }
```

<!-- prettier-ignore -->
```css
a { @include foo; }
```

### `"never"`

There _must never_ be a trailing semicolon.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a { background: orange; color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink }
```

<!-- prettier-ignore -->
```css
a { background: orange; color: pink }
```

## Optional secondary options

### `ignore: ["single-declaration"]`

Ignore declaration blocks that contain a single declaration.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink }
```

<!-- prettier-ignore -->
```css
a { color: pink; }
```
