# property-no-unknown

Disallow unknown properties.

<!-- prettier-ignore -->
```css
a { heigth: 100%; }
/** ↑
 * This property */
```

This rule considers properties defined in the [CSS Specifications and browser specific properties](https://github.com/betit/known-css-properties#source) to be known.

This rule ignores:

- variables (`$sass`, `@less`, `--custom-property`)
- vendor-prefixed properties (e.g., `-moz-align-self`, `-webkit-align-self`)

Use option `checkPrefixed` described below to turn on checking of vendor-prefixed properties.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  colr: blue;
}
```

<!-- prettier-ignore -->
```css
a {
  my-property: 1;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: green;
}
```

<!-- prettier-ignore -->
```css
a {
  fill: black;
}
```

<!-- prettier-ignore -->
```css
a {
  -moz-align-self: center;
}
```

<!-- prettier-ignore -->
```css
a {
  -webkit-align-self: center;
}
```

<!-- prettier-ignore -->
```css
a {
  align-self: center;
}
```

## Optional secondary options

### `ignoreProperties: ["/regex/", /regex/, "string"]`

Given:

```
["/^my-/", "custom"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  my-property: 10px;
}
```

<!-- prettier-ignore -->
```css
a {
  my-other-property: 10px;
}
```

<!-- prettier-ignore -->
```css
a {
  custom: 10px;
}
```

### `ignoreSelectors: ["/regex/", /regex/, "string"]`

Skips checking properties of the given selectors against this rule.

Given:

```
[":root"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
:root {
  my-property: blue;
}
```

### `ignoreAtRules: ["/regex/", /regex/, "string"]`

Ignores properties nested within specified at-rules.

Given:

```
["supports"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@supports (display: grid) {
  a {
    my-property: 1;
  }
}
```

### `checkPrefixed: true | false` (default: `false`)

If `true`, this rule will check vendor-prefixed properties.

For example with `true`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  -webkit-overflow-scrolling: auto;
}
```

<!-- prettier-ignore -->
```css
a {
  -moz-box-flex: 0;
}
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  -moz-align-self: center;
}
```

<!-- prettier-ignore -->
```css
a {
  -moz-overflow-scrolling: center;
}
```
