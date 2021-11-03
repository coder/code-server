# declaration-no-important

Disallow `!important` within declarations.

<!-- prettier-ignore -->
```css
a { color: pink !important; }
/**             ↑
 * This !important */
```

If you always want `!important` in your declarations, e.g. if you're writing [user styles](https://userstyles.org/), you can _safely_ add them using [`postcss-safe-important`](https://github.com/crimx/postcss-safe-important).

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink !important; }
```

<!-- prettier-ignore -->
```css
a { color: pink ! important; }
```

<!-- prettier-ignore -->
```css
a { color: pink!important; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```
