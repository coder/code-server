# number-no-trailing-zeros

Disallow trailing zeros in numbers.

<!-- prettier-ignore -->
```css
a { top: 0.5000px; bottom: 1.0px; }
/**         ↑                ↑
 *        These trailing zeros */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix some of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { top: 1.0px }
```

<!-- prettier-ignore -->
```css
a { top: 1.01000px }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { top: 1px }
```

<!-- prettier-ignore -->
```css
a { top: 1.01px }
```
