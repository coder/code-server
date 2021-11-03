# selector-max-attribute

Limit the number of attribute selectors in a selector.

<!-- prettier-ignore -->
```css
    [rel="external"] {}
/** ↑
 * This type of selector */
```

This rule resolves nested selectors before counting the number of attribute selectors. Each selector in a [selector list](https://www.w3.org/TR/selectors4/#selector-list) is evaluated separately.

The `:not()` pseudo-class is also evaluated separately. The rule processes the argument as if it were an independent selector, and the result does not count toward the total for the entire selector.

## Options

`int`: Maximum attribute selectors allowed.

For example, with `2`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
[type="number"][name="quality"][data-attribute="value"] {}
```

<!-- prettier-ignore -->
```css
[type="number"][name="quality"][disabled] {}
```

<!-- prettier-ignore -->
```css
[type="number"][name="quality"] {
  & [data-attribute="value"] {}
}
```

<!-- prettier-ignore -->
```css
[type="number"][name="quality"] {
  & [disabled] {}
}
```

<!-- prettier-ignore -->
```css
[type="number"][name="quality"] {
  & > [data-attribute="value"] {}
}
```

<!-- prettier-ignore -->
```css
/* `[type="text"][data-attribute="value"][disabled]` is inside `:not()`, so it is evaluated separately */
input:not([type="text"][data-attribute="value"][disabled]) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
[type="text"] {}
```

<!-- prettier-ignore -->
```css
[type="text"][name="message"] {}
```

<!-- prettier-ignore -->
```css
[type="text"][disabled]
```

<!-- prettier-ignore -->
```css
/* each selector in a selector list is evaluated separately */
[type="text"][name="message"],
[type="number"][name="quality"] {}
```

<!-- prettier-ignore -->
```css
/* `[disabled]` is inside `:not()`, so it is evaluated separately */
[type="text"][name="message"]:not([disabled]) {}
```

## Optional secondary options

### `ignoreAttributes: ["/regex/", /regex/, "string"]`

Given:

```
["/^my-/", "dir"]
```

For example, with `0`.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
[dir] [my-attr] {}
```

<!-- prettier-ignore -->
```css
[dir] [my-other-attr] {}
```
