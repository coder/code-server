# value-list-comma-newline-before

Require a newline or disallow whitespace before the commas of value lists.

<!-- prettier-ignore -->
```css
  a { background-size: 0
    , 0; }
/** ↑
 * The newline before this comma */
```

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline before the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { background-size: 0,0; }
```

<!-- prettier-ignore -->
```css
a { background-size: 0,
      0; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { background-size: 0
      , 0; }
```

### `"always-multi-line"`

There _must always_ be a newline before the commas in multi-line value lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { background-size: 0,
      0; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { background-size: 0, 0; }
```

<!-- prettier-ignore -->
```css
a { background-size: 0,0; }
```

<!-- prettier-ignore -->
```css
a { background-size: 0
      , 0; }
```

### `"never-multi-line"`

There _must never_ be whitespace before the commas in multi-line value lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { background-size: 0
      , 0; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { background-size: 0,0; }
```

<!-- prettier-ignore -->
```css
a { background-size: 0, 0; }
```

<!-- prettier-ignore -->
```css
a { background-size: 0,
      0; }
```
