# color-hex-length

Specify short or long notation for hex colors.

<!-- prettier-ignore -->
```css
a { color: #fff }
/**        ↑
 * This hex color */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"short"|"long"`

### `"short"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: #ffffff; }
```

<!-- prettier-ignore -->
```css
a { color: #ffffffaa; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: #fff; }
```

<!-- prettier-ignore -->
```css
a { color: #fffa; }
```

<!-- prettier-ignore -->
```css
a { color: #a4a4a4; }
```

### `"long"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: #fff; }
```

<!-- prettier-ignore -->
```css
a { color: #fffa; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: #ffffff; }
```

<!-- prettier-ignore -->
```css
a { color: #ffffffaa; }
```
