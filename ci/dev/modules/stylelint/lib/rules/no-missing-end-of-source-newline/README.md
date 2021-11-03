# no-missing-end-of-source-newline

Disallow missing end-of-source newlines.

<!-- prettier-ignore -->
```css
    a { color: pink; }
    \n
/** ↑
 * This newline */
```

Completely empty files are not considered violations.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
\n
```
