# selector-max-universal

Limit the number of universal selectors in a selector.

<!-- prettier-ignore -->
```css
    * {}
/** ↑
 * This universal selector */
```

This rule resolves nested selectors before counting the number of universal selectors. Each selector in a [selector list](https://www.w3.org/TR/selectors4/#selector-list) is evaluated separately.

The logical combinations pseudo-class (e.g. `:not`, `:has`) is also evaluated separately. The rule processes the argument as if it were an independent selector, and the result does not count toward the total for the entire selector.

## Options

`int`: Maximum universal selectors allowed.

For example, with `2`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
* * * {}
```

<!-- prettier-ignore -->
```css
* * {
  & * {}
}
```

<!-- prettier-ignore -->
```css
* * {
  & > * {}
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
* {}
```

<!-- prettier-ignore -->
```css
* * {}
```

<!-- prettier-ignore -->
```css
.foo * {}
```

<!-- prettier-ignore -->
```css
*.foo * {}
```

<!-- prettier-ignore -->
```css
/* each selector in a selector list is evaluated separately */
*.foo,
*.bar * {}
```

<!-- prettier-ignore -->
```css
/* `*` is inside `:not()`, so it is evaluated separately */
* > * .foo:not(*) {}
```
