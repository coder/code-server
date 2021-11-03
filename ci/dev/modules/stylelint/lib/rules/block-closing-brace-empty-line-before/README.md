# block-closing-brace-empty-line-before

Require or disallow an empty line before the closing brace of blocks.

<!-- prettier-ignore -->
```css
a {
  color: pink;
  /* ← */
} /* ↑ */
/**  ↑
 * This line */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always-multi-line"|"never"`

### `always-multi-line`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink;

}
```

<!-- prettier-ignore -->
```css
a { color: pink; }
```

### `never`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink;

}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: pink;
}
```

<!-- prettier-ignore -->
```css
a { color: pink; }
```

## Optional secondary options

### `except: ["after-closing-brace"]`

When a rule is nested, `after-closing-brace` brace will reverse the primary option.

For example, with `"never"` and `except: ["after-closing-brace"]`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media print {

  a {
    color: aquamarine;
  }
}
```

<!-- prettier-ignore -->
```css
@supports (animation-name: test) {

  a {
    color: aquamarine;
  }
}
```

<!-- prettier-ignore -->
```css
@keyframes test {

  100% {
    color: aquamarine;
  }
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media print {

  a {
    color: aquamarine;
  }

}
```

<!-- prettier-ignore -->
```css
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2");
}
```

<!-- prettier-ignore -->
```css
@supports (animation-name: test) {

  a {
    color: aquamarine;
  }

}
```

<!-- prettier-ignore -->
```css
@keyframes test {

  100% {
    color: aquamarine;
  }

}
```

For example, with `"always-multi-line"` and `except: ["after-closing-brace"]`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media print {

  a {
    color: aquamarine;

  }

}
```

<!-- prettier-ignore -->
```css
@supports (animation-name: test) {

  a {
    color: aquamarine;

  }

}
```

<!-- prettier-ignore -->
```css
@keyframes test {

  100% {
    color: aquamarine;

  }

}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media print {

  a {
    color: aquamarine;

  }
}
```

<!-- prettier-ignore -->
```css
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2");

}
```

<!-- prettier-ignore -->
```css
@supports (animation-name: test) {

  a {
    color: aquamarine;

  }
}
```

<!-- prettier-ignore -->
```css
@keyframes test {

  100% {
    color: aquamarine;

  }
}
```
