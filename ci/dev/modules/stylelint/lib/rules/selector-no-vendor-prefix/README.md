# selector-no-vendor-prefix

Disallow vendor prefixes for selectors.

<!-- prettier-ignore -->
```css
input::-moz-placeholder {}
/**     ↑
 * This prefix */
```

This rule does not blanketly condemn vendor prefixes. Instead, it uses [Autoprefixer's](https://github.com/postcss/autoprefixer) up-to-date data (from [caniuse.com](http://caniuse.com/)) to know whether a vendor prefix should cause a violation or not. _If you've included a vendor prefixed selector that has a standard alternative, one that Autoprefixer could take care of for you, this rule will complain about it_. If, however, you use a non-standard vendor-prefixed selector, one that Autoprefixer would ignore and could not provide, this rule will ignore it.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
input::-moz-placeholder {}
```

<!-- prettier-ignore -->
```css
:-webkit-full-screen a {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
input::placeholder {}
```

<!-- prettier-ignore -->
```css
:full-screen a {}
```

## Optional secondary options

### `ignoreSelectors: ["/regex/", "non-regex"]`

Ignore vendor prefixes for selectors.

Given:

```
["::-webkit-input-placeholder", "/-moz-.*/"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
input::-webkit-input-placeholder {
  color: pink;
}

input::-moz-placeholder {
  color: pink;
}
```
