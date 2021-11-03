# selector-pseudo-class-disallowed-list

Specify a list of disallowed pseudo-class selectors.

<!-- prettier-ignore -->
```css
  a:hover {}
/** ↑
 * This pseudo-class selector */
```

This rule ignores selectors that use variable interpolation e.g. `:#{$variable} {}`.

## Options

`array|string|regex`: `["array", "of", "unprefixed", /pseudo-classes/ or "/regex/"]|"pseudo-class"|/regex/`

If a string is surrounded with `"/"` (e.g. `"/^nth-/"`), it is interpreted as a regular expression. This allows, for example, easy targeting of shorthands: `/^nth-/` will match `nth-child`, `nth-last-child`, `nth-of-type`, etc.

Given:

```
["hover", "/^nth-/"]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a:hover {}
```

<!-- prettier-ignore -->
```css
a:nth-of-type(5) {}
```

<!-- prettier-ignore -->
```css
a:nth-child(2) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a:focus {}
```

<!-- prettier-ignore -->
```css
a:first-of-type {}
```
