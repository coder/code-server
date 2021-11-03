# selector-max-combinators

Limit the number of combinators in a selector.

<!-- prettier-ignore -->
```css
  a > b + c ~ d e { color: pink; }
/** ↑   ↑   ↑  ↑
 * These are combinators */
```

This rule resolves nested selectors before counting the number of combinators selectors. Each selector in a [selector list](https://www.w3.org/TR/selectors4/#selector-list) is evaluated separately.

## Options

`int`: Maximum combinators selectors allowed.

For example, with `2`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a b ~ c + d {}
```

<!-- prettier-ignore -->
```css
a b ~ c {
  & > d {}
}
```

<!-- prettier-ignore -->
```css
a b {
  & ~ c {
    & + d {}
  }
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {}
```

<!-- prettier-ignore -->
```css
a b {}
```

<!-- prettier-ignore -->
```css
a b ~ c {}
```

<!-- prettier-ignore -->
```css
a b {
  & ~ c {}
}
```

<!-- prettier-ignore -->
```css
/* each selector in a selector list is evaluated separately */
a b,
c > d {}
```
