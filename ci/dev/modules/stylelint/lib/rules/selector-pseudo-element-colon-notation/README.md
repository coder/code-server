# selector-pseudo-element-colon-notation

Specify single or double colon notation for applicable pseudo-elements.

<!-- prettier-ignore -->
```css
    a::before {}
/**  ↑
 * This notation */
```

The `::` notation was chosen for _pseudo-elements_ to establish a discrimination between _pseudo-classes_ (which subclass existing elements) and _pseudo-elements_ (which are elements not represented in the document tree).

However, for compatibility with existing style sheets, user agents also accept the previous one-colon notation for _pseudo-elements_ introduced in CSS levels 1 and 2 (namely, `:first-line`, `:first-letter`, `:before` and `:after`).

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"single"|"double"`

### `"single"`

Applicable pseudo-elements _must always_ use the single colon notation.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a::before { color: pink; }
```

<!-- prettier-ignore -->
```css
a::after { color: pink; }
```

<!-- prettier-ignore -->
```css
a::first-letter { color: pink; }
```

<!-- prettier-ignore -->
```css
a::first-line { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a:before { color: pink; }
```

<!-- prettier-ignore -->
```css
a:after { color: pink; }
```

<!-- prettier-ignore -->
```css
a:first-letter { color: pink; }
```

<!-- prettier-ignore -->
```css
a:first-line { color: pink; }
```

<!-- prettier-ignore -->
```css
input::placeholder { color: pink; }
```

<!-- prettier-ignore -->
```css
li::marker { font-variant-numeric: tabular-nums; }
```

### `"double"`

Applicable pseudo-elements _must always_ use the double colon notation.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a:before { color: pink; }
```

<!-- prettier-ignore -->
```css
a:after { color: pink; }
```

<!-- prettier-ignore -->
```css
a:first-letter { color: pink; }
```

<!-- prettier-ignore -->
```css
a:first-line { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a::before { color: pink; }
```

<!-- prettier-ignore -->
```css
a::after { color: pink; }
```

<!-- prettier-ignore -->
```css
a::first-letter { color: pink; }
```

<!-- prettier-ignore -->
```css
a::first-line { color: pink; }
```

<!-- prettier-ignore -->
```css
input::placeholder { color: pink; }
```

<!-- prettier-ignore -->
```css
li::marker { font-variant-numeric: tabular-nums; }
```
