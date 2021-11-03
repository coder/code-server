# function-whitespace-after

Require or disallow whitespace after functions.

<!-- prettier-ignore -->
```css
a { transform: translate(1, 1) scale(3); }
/**                           ↑
 *                   This space */
```

This rule does not check for space immediately after `)` if the very next character is `,`, `)`, `/` or `}`, allowing some of the patterns exemplified below.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be whitespace after the function.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { transform: translate(1, 1)scale(3); }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { transform: translate(1, 1) scale(3); }
```

<!-- prettier-ignore -->
```css
a { transform: translate(1, 1)     scale(3); }
```

<!-- prettier-ignore -->
```css
a {
  transform:
    translate(1, 1)
    scale(3);
}
```

<!-- prettier-ignore -->
```css
/* notice the two closing parentheses without a space between */
a { top: calc(1 * (1 + 3)); }
```

<!-- prettier-ignore -->
```css
/* notice the ), with no space after the closing parenthesis */
a { padding: calc(1 * 2px), calc(2 * 5px); }
```

### `"never"`

There _must never_ be whitespace after the function.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { transform: translate(1, 1) scale(3); }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { transform: translate(1, 1)scale(3); }
```
