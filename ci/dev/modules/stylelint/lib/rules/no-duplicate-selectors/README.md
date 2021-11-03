# no-duplicate-selectors

Disallow duplicate selectors within a stylesheet.

<!-- prettier-ignore -->
```css
    .foo {} .bar {} .foo {}
/** ↑              ↑
 * These duplicates */
```

This rule checks for two types of duplication:

- Duplication of a single selector with a rule's selector list, e.g. `a, b, a {}`.
- Duplication of a selector list within a stylesheet, e.g. `a, b {} a, b {}`. Duplicates are found even if the selectors come in different orders or have different spacing, e.g. `a d, b > c {} b>c, a d {}`.

The same selector _is_ allowed to repeat in the following circumstances:

- It is used in different selector lists, e.g. `a {} a, b {}`.
- The duplicates are determined to originate in different stylesheets, e.g. you have concatenated or compiled files in a way that produces sourcemaps for PostCSS to read, e.g. postcss-import.
- The duplicates are in rules with different parent nodes, e.g. inside and outside of a media query.

This rule resolves nested selectors. So `a b {} a { & b {} }` counts as a violation, because the resolved selectors end up with a duplicate.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
.foo,
.bar,
.foo {}
```

<!-- prettier-ignore -->
```css
.foo {}
.bar {}
.foo {}
```

<!-- prettier-ignore -->
```css
.foo .bar {}
.bar {}
.foo .bar {}
```

<!-- prettier-ignore -->
```css
@media (min-width: 10px) {
  .foo {}
  .foo {}
}
```

<!-- prettier-ignore -->
```css
.foo, .bar {}
.bar, .foo {}
```

<!-- prettier-ignore -->
```css
a .foo, b + .bar {}
b+.bar,
a
  .foo {}
```

<!-- prettier-ignore -->
```css
a b {}
a {
  & b {}
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.foo {}
@media (min-width: 10px) {
  .foo {}
}
```

<!-- prettier-ignore -->
```css
.foo {
  .foo {}
}
```

<!-- prettier-ignore -->
```css
.foo {}
.bar {}
.foo .bar {}
.bar .foo {}
```

<!-- prettier-ignore -->
```css
a b {}
a {
  & b,
  & c {}
}
```

## Optional secondary options

### `disallowInList: true | false` (default: `false`)

This option will also disallow duplicate selectors within selector lists.

For example, with `true`.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
input, textarea {
  border: 2px;
}

textarea {
  border: 1px;
}

```
