# function-name-case

Specify lowercase or uppercase for function names.

<!-- prettier-ignore -->
```css
a { width: calc(5% - 10em); }
/**        ↑
 * This function */
```

Camel case function names, e.g. `translateX`, are accounted for when the `lower` option is used.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  width: Calc(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  width: cAlC(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  width: CALC(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  background: -WEBKIT-RADIAL-GRADIENT(red, green, blue);
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  width: calc(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  background: -webkit-radial-gradient(red, green, blue);
}
```

### `"upper"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  width: Calc(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  width: cAlC(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  width: calc(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  background: -webkit-radial-gradient(red, green, blue);
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  width: CALC(5% - 10em);
}
```

<!-- prettier-ignore -->
```css
a {
  background: -WEBKIT-RADIAL-GRADIENT(red, green, blue);
}
```

## Optional secondary options

### `ignoreFunctions: ["/regex-as-string/", /regex/, "non-regex"]`

Ignore case of function names.

For example, with `"lower"`.

Given:

```
["some-function", "/^get.*$/"]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: sOmE-FuNcTiOn();
}
```

<!-- prettier-ignore -->
```css
a {
  color: some-other-function();
}
```

<!-- prettier-ignore -->
```css
a {
  color: GetColor();
}
```

<!-- prettier-ignore -->
```css
a {
  color: GET_COLOR();
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  display: some-function();
}
```

<!-- prettier-ignore -->
```css
a {
  display: getColor();
}
```

<!-- prettier-ignore -->
```css
a {
  display: get_color();
}
```
