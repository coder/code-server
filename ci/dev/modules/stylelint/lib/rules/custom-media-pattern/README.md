# custom-media-pattern

Specify a pattern for custom media query names.

<!-- prettier-ignore -->
```css
@custom-media --foo (max-width: 30em);
/**             ↑
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
@custom-media --bar (min-width: 30em);
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@custom-media --foo-bar (min-width: 30em);
```
