# no-extra-semicolons

Disallow extra semicolons.

<!-- prettier-ignore -->
```css
a { color: pink;; }
/**             ↑
 *  This semicolons */
```

This rule ignores semicolons after Less mixins.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@import "x.css";;
```

<!-- prettier-ignore -->
```css
@import "x.css";
;
```

<!-- prettier-ignore -->
```css
a {
  color: pink;;
}
```

<!-- prettier-ignore -->
```css
a {
  ;color: pink;
}
```

<!-- prettier-ignore -->
```css
a {
  color: pink;
  ;
}
```

<!-- prettier-ignore -->
```css
a {
  color: red;
}
;
b {
  color: white;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@import "x.css";
```

<!-- prettier-ignore -->
```css
a {
  color: pink;
}
```
