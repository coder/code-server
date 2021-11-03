# selector-max-id

Limit the number of ID selectors in a selector.

<!-- prettier-ignore -->
```css
    #foo {}
/** ↑
 * This type of selector */
```

This rule resolves nested selectors before counting the number of ID selectors. Each selector in a [selector list](https://www.w3.org/TR/selectors4/#selector-list) is evaluated separately.

The `:not()` pseudo-class is also evaluated separately. The rule processes the argument as if it were an independent selector, and the result does not count toward the total for the entire selector.

## Options

`int`: Maximum universal selectors allowed.

For example, with `2`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
#foo #bar #baz {}
```

<!-- prettier-ignore -->
```css
#foo #bar {
  & #baz {}
}
```

<!-- prettier-ignore -->
```css
#foo #bar {
  & > #bar {}
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
#foo {}
```

<!-- prettier-ignore -->
```css
#foo #bar {}
```

<!-- prettier-ignore -->
```css
.foo #foo {}
```

<!-- prettier-ignore -->
```css
#foo.foo #bar {}
```

<!-- prettier-ignore -->
```css
/* each selector in a selector list is evaluated separately */
#foo,
#baz #quux {}
```

<!-- prettier-ignore -->
```css
/* `#bar` is inside `:not()`, so it is evaluated separately */
#foo #bar:not(#baz) {}
```

### `ignoreContextFunctionalPseudoClasses: ["/regex/", /regex/, "non-regex"]`

Ignore selectors inside of specified [functional pseudo-classes](https://drafts.csswg.org/selectors-4/#pseudo-classes) that provide [evaluation contexts](https://drafts.csswg.org/selectors-4/#specificity-rules).

Given:

```js
[":not", /^:(h|H)as$/];
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a:matches(#foo) {}
```

While the following patters are _not_ considered violations:

<!-- prettier-ignore -->
```css
a:not(#foo) {}
```

<!-- prettier-ignore -->
```css
a:has(#foo) {}
```
