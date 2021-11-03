# keyframes-name-pattern

Specify a pattern for keyframe names.

<!-- prettier-ignore -->
```css
@keyframes slide-right {}
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
@keyframes foo {}
```

<!-- prettier-ignore -->
```css
@keyframes bar {}
```

<!-- prettier-ignore -->
```css
@keyframes FOO-bar {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@keyframes foo-bar {}
```
