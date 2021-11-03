# block-closing-brace-space-before

Require a single space or disallow whitespace before the closing brace of blocks.

<!-- prettier-ignore -->
```css
a { color: pink; }
/**              ↑
 * The space before this brace */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a single space before the closing brace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;}
```

<!-- prettier-ignore -->
```css
a
{ color: pink;}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

### `"never"`

There _must never_ be whitespace before the closing brace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a
{ color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink;}
```

<!-- prettier-ignore -->
```css
a{
color: pink;}
```

### `"always-single-line"`

There _must always_ be a single space before the closing brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a {
color: pink;}
```

### `"never-single-line"`

There _must never_ be whitespace before the closing brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;}
```

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

### `"always-multi-line"`

There _must always_ be a single space before the closing brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
color: pink;}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;}
```

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

### `"never-multi-line"`

There _must never_ be whitespace before the closing brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a {
color: pink;}
```
