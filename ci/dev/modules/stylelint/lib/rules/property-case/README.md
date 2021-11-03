# property-case

Specify lowercase or uppercase for properties.

<!-- prettier-ignore -->
```css
    a { width: 1px; }
/**     ↑
 * This property */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  Width: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  WIDTH: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  widtH: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  border-Radius: 5px;
}
```

<!-- prettier-ignore -->
```css
a {
  -WEBKIT-animation-duration: 3s;
}
```

<!-- prettier-ignore -->
```css
@media screen and (orientation: landscape) {
  WiDtH: 500px;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  width: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  border-radius: 5px;
}
```

<!-- prettier-ignore -->
```css
a {
  -webkit-animation-duration: 3s;
}
```

<!-- prettier-ignore -->
```css
@media screen and (orientation: landscape) {
  width: 500px;
}
```

### `"upper"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  Width: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  width: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  widtH: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  border-Radius: 5px;
}
```

<!-- prettier-ignore -->
```css
a {
  -WEBKIT-animation-duration: 3s;
}
```

<!-- prettier-ignore -->
```css
@media screen and (orientation: landscape) {
  WiDtH: 500px;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  WIDTH: 1px
}
```

<!-- prettier-ignore -->
```css
a {
  BORDER-RADIUS: 5px;
}
```

<!-- prettier-ignore -->
```css
a {
  -WEBKIT-ANIMATION-DURATION: 3s;
}
```

<!-- prettier-ignore -->
```css
@media screen and (orientation: landscape) {
  WIDTH: 500px;
}
```
