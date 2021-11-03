# media-feature-name-case

Specify lowercase or uppercase for media feature names.

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
/**     ↑
 * This media feature name */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media (MIN-WIDTH: 700px) {}
```

<!-- prettier-ignore -->
```css
@media not all and (MONOCHROME) {}
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and (ORIENTATION: landscape) {}
```

<!-- prettier-ignore -->
```css
@media (WIDTH > 10em) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media not all and (monochrome) {}
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and (orientation: landscape) {}
```

<!-- prettier-ignore -->
```css
@media (width > 10em) {}
```

### `"upper"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media not all and (monochrome) {}
```

<!-- prettier-ignore -->
```css
@media (MIN-WIDTH: 700px) and (orientation: landscape) {}
```

<!-- prettier-ignore -->
```css
@media (10em < width <= 50em) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media (MIN-WIDTH: 700px) {}
```

<!-- prettier-ignore -->
```css
@media not all and (MONOCHROME) {}
```

<!-- prettier-ignore -->
```css
@media (MIN-WIDTH: 700px) and (ORIENTATION: landscape) {}
```

<!-- prettier-ignore -->
```css
@media (10em < WIDTH <= 50em) {}
```
