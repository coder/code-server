# function-linear-gradient-no-nonstandard-direction

Disallow direction values in `linear-gradient()` calls that are not valid according to the
[standard syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient#Syntax).

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(to top, #fff, #000); }
/**                                ↑
 * This (optional) first argument is the "direction" */
```

A valid and standard direction value is one of the following:

- an angle
- `to` plus a side-or-corner (`to top`, `to bottom`, `to left`, `to right`; `to top right`, `to right top`, `to bottom left`, etc.)

A common mistake (matching outdated non-standard syntax) is to use just a side-or-corner without the preceding `to`.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(top, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(bottom, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(left, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(45, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(to top top, #fff, #000); }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(to top, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(to bottom right, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(45deg, #fff, #000); }
```

<!-- prettier-ignore -->
```css
.foo { background: linear-gradient(1.57rad, #fff, #000); }
```

<!-- prettier-ignore -->
```css
/* Direction defaults to "to bottom" */
.foo { background: linear-gradient(#fff, #000); }
```
