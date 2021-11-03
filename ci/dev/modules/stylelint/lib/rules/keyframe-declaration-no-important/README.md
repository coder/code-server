# keyframe-declaration-no-important

Disallow `!important` within keyframe declarations.

<!-- prettier-ignore -->
```css
@keyframes foo {
  from { opacity: 0 }
  to { opacity: 1 !important }
}              /* ↑ */
/**               ↑
*   This !important */
```

Using `!important` within keyframes declarations is [completely ignored in some browsers](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#!important_in_a_keyframe).

## Options

### `true`

The following patterns is considered a violation:

<!-- prettier-ignore -->
```css
@keyframes foo {
  from {
    opacity: 0;
  }
  to {
    opacity: 1 !important;
  }
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@keyframes foo {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

<!-- prettier-ignore -->
```css
a { color: pink !important; }
```
