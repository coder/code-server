# hue-degree-notation

Specify number or angle notation for degree hues.

<!-- prettier-ignore -->
```css
    a { color: hsl(198deg 28% 50%) }
/**                ↑
 *                 This notation */
```

Because hues are so often given in degrees, a hue can also be given as a number, which is interpreted as a number of degrees.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"angle"|"number"`

### `"angle"`

Degree hues _must always_ use angle notation.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: hsl(198 28% 50%) }
```

<!-- prettier-ignore -->
```css
a { color: lch(56.29% 19.86 10 / 15%) }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: hsl(198deg 28% 50%) }
```

<!-- prettier-ignore -->
```css
a { color: lch(56.29% 19.86 10deg / 15%) }
```

### `"number"`

Degree hues _must always_ use the number notation.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: hsl(198deg 28% 50%) }
```

<!-- prettier-ignore -->
```css
a { color: lch(56.29% 19.86 10deg / 15%) }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: hsl(198 28% 50%) }
```

<!-- prettier-ignore -->
```css
a { color: lch(56.29% 19.86 10 / 15%) }
```
