# shorthand-property-no-redundant-values

Disallow redundant values in shorthand properties.

<!-- prettier-ignore -->
```css
a { margin: 1px 1px 1px 1px; }
/**             ↑   ↑   ↑
 *           These values */
```

This rule alerts you when you use redundant values in the following shorthand properties:

- `margin`
- `padding`
- `border-color`
- `border-radius`
- `border-style`
- `border-width`
- `grid-gap`

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { margin: 1px 1px; }
```

<!-- prettier-ignore -->
```css
a { margin: 1px 1px 1px 1px; }
```

<!-- prettier-ignore -->
```css
a { padding: 1px 2px 1px; }
```

<!-- prettier-ignore -->
```css
a { border-radius: 1px 2px 1px 2px; }
```

<!-- prettier-ignore -->
```css
a { -webkit-border-radius: 1px 1px 1px 1px; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { margin: 1px; }
```

<!-- prettier-ignore -->
```css
a { margin: 1px 1px 1px 2px; }
```

<!-- prettier-ignore -->
```css
a { padding: 1px 1em 1pt 1pc; }
```

<!-- prettier-ignore -->
```css
a { border-radius: 10px / 5px; }
```
