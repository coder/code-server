# selector-no-qualifying-type

Disallow qualifying a selector by type.

<!-- prettier-ignore -->
```css
    a.foo {}
/** ↑
 * This type selector is qualifying the class */
```

A type selector is "qualifying" when it is compounded with (chained to) another selector (e.g. `a.foo`, `a#foo`). This rule does not regulate type selectors that are combined with other selectors via a combinator (e.g. `a > .foo`, `a #foo`).

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a.foo {
  margin: 0
}
```

<!-- prettier-ignore -->
```css
a#foo {
  margin: 0
}
```

<!-- prettier-ignore -->
```css
input[type='button'] {
  margin: 0
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.foo {
  margin: 0
}
```

<!-- prettier-ignore -->
```css
#foo {
  margin: 0
}
```

<!-- prettier-ignore -->
```css
input {
  margin: 0
}
```

## Optional secondary options

### `ignore: ["attribute", "class", "id"]`

#### `"attribute"`

Allow attribute selectors qualified by type.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
input[type='button'] {
  margin: 0
}
```

#### `"class"`

Allow class selectors qualified by type.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a.foo {
  margin: 0
}
```

#### `"id"`

Allow ID selectors qualified by type.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a#foo {
  margin: 0
}
```
