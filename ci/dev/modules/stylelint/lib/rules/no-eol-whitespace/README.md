# no-eol-whitespace

Disallow end-of-line whitespace.

<!-- prettier-ignore -->
```css
a { color: pink; }···
/**               ↑
 *  This whitespace */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix most of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }·
```

<!-- prettier-ignore -->
```css
a { color: pink; }····
```

Comment strings are also checked -- so the following is a violation:

<!-- prettier-ignore -->
```css
/* something····
 * something else */
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
/* something
 * something else */
```

## Optional secondary options

### `ignore: ["empty-lines"]`

#### `"empty-lines"`

Allow end-of-line whitespace for lines that are only whitespace, "empty" lines.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink;
··
  background: orange;
}
```

<!-- prettier-ignore -->
```css
····
```

<!-- prettier-ignore -->
```css
a { color: pink; }
····
```
