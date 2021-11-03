# selector-list-comma-newline-after

Require a newline or disallow whitespace after the commas of selector lists.

<!-- prettier-ignore -->
```css
   a,
   b↑{ color: pink; }
/** ↑
 * The newline after this comma */
```

End-of-line comments are allowed one space after the comma.

<!-- prettier-ignore -->
```css
a, /* comment */
b { color: pink; }
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline after the commas.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a, b { color: pink; }
```

<!-- prettier-ignore -->
```css
a
, b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a,
b { color: pink; }
```

<!-- prettier-ignore -->
```css
a
,
b { color: pink; }
```

### `"always-multi-line"`

There _must always_ be a newline after the commas in multi-line selector lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a
, b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a, b { color: pink; }
```

<!-- prettier-ignore -->
```css
a,
b { color: pink; }
```

<!-- prettier-ignore -->
```css
a
,
b { color: pink; }
```

### `"never-multi-line"`

There _must never_ be whitespace after the commas in multi-line selector lists.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a
, b { color: pink; }
```

<!-- prettier-ignore -->
```css
a,
b { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a,b { color: pink; }
```

<!-- prettier-ignore -->
```css
a
,b { color: pink; }
```
