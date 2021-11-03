# rule-empty-line-before

Require or disallow an empty line before rules.

<!-- prettier-ignore -->
```css
a {}
      /* ← */
b {}  /* ↑ */
/**      ↑
 * This line */
```

This rule ignores rules that are the very first node in a source.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule. We recommend to enable [`indentation`](../indentation/README.md) rule for better autofixing results with this rule.

## Options

`string`: `"always"|"never"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be an empty line before rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {} b {}
```

<!-- prettier-ignore -->
```css
a {}
b {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {}

b {}
```

### `"never"`

There _must never_ be an empty line before rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {}

b {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {} b {}
```

<!-- prettier-ignore -->
```css
a {}
b {}
```

### `"always-multi-line"`

There _must always_ be an empty line before multi-line rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: red;
}
b {
  color: blue;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: red;
}

b {
  color: blue;
}
```

### `"never-multi-line"`

There _must never_ be an empty line before multi-line rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: red;
}

b {
  color: blue;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: red;
}
b {
  color: blue;
}
```

## Optional secondary options

### `except: ["after-rule", "after-single-line-comment", "inside-block-and-after-rule", "inside-block", "first-nested"]`

#### `"after-rule"`

Reverse the primary option for rules that follow another rule.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {}

b {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {}
b {}
```

#### `"after-single-line-comment"`

Reverse the primary option for rules that follow a single-line comment.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
/* comment */

a {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/* comment */
a {}
```

#### `"inside-block-and-after-rule"`

Reverse the primary option for rules that are inside a block and follow another rule.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media {

  a {}

  b {}
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media {

  a {}
  b {}
}
```

#### `"inside-block"`

Reverse the primary option for rules that are inside a block.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  color: red;

  & b {
    color: blue;
  }
}

```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  color: red;
  & b {
    color: blue;
  }
}
```

#### `"first-nested"`

Reverse the primary option for rules that are nested and the first child of their parent node.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media {

  a {}

  b {}
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media {
  a {}

  b {}
}
```

### `ignore: ["after-comment", "first-nested", "inside-block"]`

#### `"after-comment"`

Ignore rules that follow a comment.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/* comment */
a {}
```

#### `"first-nested"`

Ignore rules that are nested and the first child of their parent node.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media {
  a {}

  b {}
}
```

#### `"inside-block"`

Ignore rules that are inside a block.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media {
  a {}
}
```

<!-- prettier-ignore -->
```css
@media {
  a {}
  b {}
}
```
