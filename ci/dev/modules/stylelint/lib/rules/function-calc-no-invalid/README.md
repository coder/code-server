# function-calc-no-invalid

Disallow an invalid expression within `calc` functions.

<!-- prettier-ignore -->
```css
.foo {width: calc();}
/**               ↑
 * empty expression */
.foo {width: calc(100% 80px);}
/**                   ↑
/* missing operator */
.foo {width: calc(100% -80px);}
/**                   ↑
/* missing operator */
.foo {width: calc(100% - - 80px);}
/**                      ↑
/* unexpected operator */
.foo {width: calc(100% -);}
/**                    ↑
/* unexpected operator */
.foo {width: calc(- 100%);}
/**               ↑
/* unexpected operator */
.foo {width: calc(100% / 0);}
/**                    ↑ ↑
/* division by zero */
.foo {width: calc(100px + 80);}
/**                  ↑  ↑  ↑
/* the `resolved type` is invalid */
.foo {width: calc(100% + 80);}
/**                  ↑ ↑  ↑
/* the `resolved type` is invalid */
.foo {width: calc(100px - 80);}
/**                  ↑  ↑  ↑
/* the `resolved type` is invalid */
.foo {width: calc(100px * 80px);}
/**                  ↑  ↑   ↑
/* the `resolved type` is invalid */
.foo {width: calc(100 / 80%);}
/**                 ↑ ↑   ↑
/* the `resolved type` is invalid */
```

- `calc()` must have an expression.
- `calc()` must have an operator between the arguments.
- `calc()` must not be division by zero.
- [The resolved type](https://www.w3.org/TR/css-values-3/#calc-type-checking) must be valid for where the expression is placed.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
.foo {width: calc();}
```

<!-- prettier-ignore -->
```css
.foo {width: calc(100% 80px);}
```

<!-- prettier-ignore -->
```css
.foo {width: calc(100% - - 80px);}
```

<!-- prettier-ignore -->
```css
.foo {width: calc(100% / 0);}
```

<!-- prettier-ignore -->
```css
.foo {width: calc(100px + 80);}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.foo {width: calc(100% - 80px);}
```

<!-- prettier-ignore -->
```css
.foo {width: calc(100% - var(--bar));}
```

<!-- prettier-ignore -->
```css
.foo {width: calc(var(--bar) - var(--baz));}
```
