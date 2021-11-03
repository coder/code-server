# string-quotes

Specify single or double quotes around strings.

<!-- prettier-ignore -->
```css
a[id="foo"] { content: "x"; }
/**  ↑   ↑             ↑ ↑
 * These quotes and these quotes */
```

Quotes within comments are ignored.

<!-- prettier-ignore -->
```css
/* "This is fine" */
/* 'And this is also fine' */
```

Single quotes in a charset @-rule are ignored as using single quotes in this context is incorrect according the [CSS specification](https://www.w3.org/TR/CSS2/syndata.html#x57).

<!-- prettier-ignore -->
```css
@charset "utf-8"
/* fine regardless of configuration */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix most of the problems reported by this rule.

## Options

`string`: `"single"|"double"`

### `"single"`

Strings _must always_ be wrapped with single quotes.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { content: "x"; }
```

<!-- prettier-ignore -->
```css
a[id="foo"] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { content: 'x'; }
```

<!-- prettier-ignore -->
```css
a[id='foo'] {}
```

<!-- prettier-ignore -->
```css
a { content: "x'y'z"; }
```

### `"double"`

Strings _must always_ be wrapped with double quotes.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { content: 'x'; }
```

<!-- prettier-ignore -->
```css
a[id='foo'] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { content: "x"; }
```

<!-- prettier-ignore -->
```css
a[id="foo"] {}
```

<!-- prettier-ignore -->
```css
a { content: 'x"y"z'; }
```

## Optional secondary options

### `avoidEscape`: `true|false`, defaults to `true`

Allows strings to use single-quotes or double-quotes so long as the string contains a quote that would have to be escaped otherwise.

For example, with `"single", { "avoidEscape" : false }`.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { content: "x'y'z"; }
```

<!-- prettier-ignore -->
```css
a[id="foo'bar'baz"] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { content: 'x'; }
```

<!-- prettier-ignore -->
```css
a[id='foo'] {}
```
