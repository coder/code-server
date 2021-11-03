# block-opening-brace-space-before

Require a single space or disallow whitespace before the opening brace of blocks.

<!-- prettier-ignore -->
```css
  a { color: pink; }
/** ↑
 * The space before this brace */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a single space before the opening brace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink; }
```

<!-- prettier-ignore -->
```css
a
{ color: pink; }
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

There _must never_ be whitespace before the opening brace.

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
a{ color: pink; }
```

<!-- prettier-ignore -->
```css
a{
color: pink; }
```

### `"always-single-line"`

There _must always_ be a single space before the opening brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{ color: pink; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
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

There _must always_ be a single space before the opening brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{
color: pink; }
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

## Optional secondary options

### `ignoreAtRules: ["/regex/", /regex/, "non-regex"]`

Given:

```
["/fo/"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@for ...
{}
```

<!-- prettier-ignore -->
```css
@for ...{}
```

### `ignoreSelectors: ["/regex/", /regex/, "non-regex"]`

Given:

```
[":root"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
:root
{}
```

<!-- prettier-ignore -->
```css
:root{}
```
