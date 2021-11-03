# block-opening-brace-newline-before

Require a newline or disallow whitespace before the opening brace of blocks.

<!-- prettier-ignore -->
```css
  a
    { color: pink; }
/** ↑
 * The newline before this brace */
```

Refer to [combining rules](../../../docs/user-guide/rules/combine.md) for more information on using this rule with [`block-opening-brace-newline-after`](../block-opening-brace-newline-after/README.md) to disallow single-line rules.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"always-single-line"|"never-single-line"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline before the opening brace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink; }
```

<!-- prettier-ignore -->
```css
a{ color: pink;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a
{ color: pink; }
```

<!-- prettier-ignore -->
```css
a
{
color: pink; }
```

<!-- prettier-ignore -->
```css
a /* foo */
  {
    color: pink;
  }
```

### `"always-single-line"`

There _must always_ be a newline before the opening brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a
{ color: pink; }
```

<!-- prettier-ignore -->
```css
a{
color: pink; }
```

### `"never-single-line"`

There _must never_ be whitespace before the opening brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink; }
```

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

### `"always-multi-line"`

There _must always_ be a newline before the opening brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{
color: pink; }
```

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink; }
```

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a
{ color: pink; }
```

<!-- prettier-ignore -->
```css
a
{
color: pink; }
```

### `"never-multi-line"`

There _must never_ be whitespace before the opening brace in multi-line blocks.

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
a{
color: pink;}
```
