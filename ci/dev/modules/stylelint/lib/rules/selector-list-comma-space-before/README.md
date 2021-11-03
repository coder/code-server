# selector-list-comma-space-before

Require a single space or disallow whitespace before the commas of selector lists.

<!-- prettier-ignore -->
```css
   a ,b { color: pink; }
/**  ↑
 * The space before this comma */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space before the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a,b { color: pink; }
```

<!-- prettier-ignore -->
```css
a, b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a ,b { color: pink; }
```

<!-- prettier-ignore -->
```css
a , b { color: pink; }
```

### `"never"`

There _must never_ be whitespace before the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a ,b { color: pink; }
```

<!-- prettier-ignore -->
```css
a , b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a,b { color: pink; }
```

<!-- prettier-ignore -->
```css
a, b { color: pink; }
```

### `"always-single-line"`

There _must always_ be a single space before the commas in single-line selector lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a,b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a,
b { color: pink; }
```

### `"never-single-line"`

There _must never_ be a single space before the commas in single-line selector lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a ,b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a ,
b { color: pink; }
```
