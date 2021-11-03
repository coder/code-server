# property-no-vendor-prefix

Disallow vendor prefixes for properties.

<!-- prettier-ignore -->
```css
a { -webkit-transform: scale(1); }
/**  ↑
 * This prefix */
```

This rule does not blanketly condemn vendor prefixes. Instead, it uses [Autoprefixer's](https://github.com/postcss/autoprefixer) up-to-date data (from [caniuse.com](http://caniuse.com/)) to know whether a vendor prefix should cause a violation or not. _If you've included a vendor prefixed property that has a standard alternative, one that Autoprefixer could take care of for you, this rule will complain about it_. If, however, you use a non-standard vendor-prefixed property, one that Autoprefixer would ignore and could not provide (such as `-webkit-touch-callout`), this rule will ignore it.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { -webkit-transform: scale(1); }
```

<!-- prettier-ignore -->
```css
a { -moz-columns: 2; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { transform: scale(1); }
```

<!-- prettier-ignore -->
```css
a {
columns: 2; }
```

<!-- prettier-ignore -->
```css
a { -webkit-touch-callout: none; }
```

## Optional secondary options

### `ignoreProperties: ["/regex/", /regex/, "string"]`

Given:

```
["transform", "columns"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { -webkit-transform: scale(1); }
```

<!-- prettier-ignore -->
```css
a { -moz-columns: 2; }
```
