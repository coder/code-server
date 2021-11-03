# custom-property-pattern

Specify a pattern for custom properties.

<!-- prettier-ignore -->
```css
a { --foo-: 1px; }
/**   ↑
 * The pattern of this */
```

## Options

`regex|string`

A string will be translated into a RegExp like so `new RegExp(yourString)` — so be sure to escape properly.

Given the string:

```
"foo-.+"
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
:root { --boo-bar: 0; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
:root { --foo-bar: 0; }
```
