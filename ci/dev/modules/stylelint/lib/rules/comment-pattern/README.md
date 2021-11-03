# comment-pattern

Specify a pattern for comments.

<!-- prettier-ignore -->
```css
/*  comment */
/** ↑
 * The pattern of this */
```

## Options

`regex|string`

A string will be translated into a RegExp like so `new RegExp(yourString)` — so be sure to escape properly.

Given the string:

```
"foo .+"
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
/*not starting with foo*/
a { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/*foo at the beginning*/
a { color: red; }
```
