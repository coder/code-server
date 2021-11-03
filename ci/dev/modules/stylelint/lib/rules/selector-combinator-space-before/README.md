# selector-combinator-space-before

Require a single space or disallow whitespace before the combinators of selectors.

<!-- prettier-ignore -->
```css
  a > b + c ~ d e >>> f { color: pink; }
/** ↑   ↑   ↑  ↑  ↑
 * These are combinators */
```

Combinators are used to combine several different selectors into new and more specific ones. There are several types of combinators, including: child (`>`), adjacent sibling (`+`), general sibling (`~`), and descendant (which is represented by a blank space between two selectors).

The descendant combinator is _not_ checked by this rule.

Also, `+` and `-` signs within `:nth-*()` arguments are not checked (e.g. `a:nth-child(2n+1)`).

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the combinators.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a+ b { color: pink; }
```

<!-- prettier-ignore -->
```css
a>b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a + b { color: pink; }
```

<!-- prettier-ignore -->
```css
a >b { color: pink; }
```

### `"never"`

There _must never_ be whitespace before the combinators.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a + b { color: pink; }
```

<!-- prettier-ignore -->
```css
a >b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a+ b { color: pink; }
```

<!-- prettier-ignore -->
```css
a>b { color: pink; }
```
