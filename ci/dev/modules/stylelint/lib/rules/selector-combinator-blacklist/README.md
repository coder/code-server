# selector-combinator-blacklist

**_Deprecated: Instead use the [`selector-combinator-disallowed-list`](../selector-combinator-disallowed-list/README.md) rule._**

Specify a list of disallowed combinators.

<!-- prettier-ignore -->
```css
  a + b {}
/** ↑
 * This combinator */
```

This rule normalizes the whitespace descendant combinator to be a single space.

This rule ignores [reference combinators](https://www.w3.org/TR/selectors4/#idref-combinators) e.g. `/for/`.

## Options

`array|string`: `["array", "of", "combinators"]|"combinator"`

Given:

```
[">", " "]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a > b {}
```

<!-- prettier-ignore -->
```css
a b {}
```

<!-- prettier-ignore -->
```css
a
b {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a + b {}
```

<!-- prettier-ignore -->
```css
a ~ b {}
```
