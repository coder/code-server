# custom-property-empty-line-before

Require or disallow an empty line before custom properties.

<!-- prettier-ignore -->
```css
a {
  top: 10px;
                          /* ← */
  --foo: pink;            /* ↑ */
}                         /* ↑ */
/**                          ↑
 *                   This line */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule. We recommend to enable [`indentation`](../indentation/README.md) rule for better autofixing results with this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  top: 10px;
  --foo: pink;
  --bar: red;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  top: 10px;

  --foo: pink;

  --bar: red;
}
```

### `"never"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  top: 10px;

  --foo: pink;

  --bar: red;
}
```

<!-- prettier-ignore -->
```css
a {

  --foo: pink;
  --bar: red;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  top: 10px;
  --foo: pink;
  --bar: red;
}
```

<!-- prettier-ignore -->
```css
a {
  --foo: pink;
  --bar: red;
}
```

## Optional secondary options

### `except: ["after-comment", "after-custom-property", "first-nested"]`

#### `"after-comment"`

Reverse the primary option for custom properties that follow a comment.

Shared-line comments do not trigger this option.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {

  --foo: pink;
  /* comment */

  --bar: red;
}
```

<!-- prettier-ignore -->
```css
a {

  --foo: pink; /* comment */
  --bar: red;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {

  --foo: pink;
  /* comment */
  --bar: red;
}
```

<!-- prettier-ignore -->
```css
a {

  --foo: pink; /* comment */

  --bar: red;
}
```

#### `"after-custom-property"`

Reverse the primary option for custom properties that follow another custom property.

Shared-line comments do not affect this option.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {

  --foo: pink;

  --bar: red;
}
```

<!-- prettier-ignore -->
```css
a {

  --foo: pink; /* comment */

  --bar: red;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {

  --foo: pink;
  --bar: red;
}
```

<!-- prettier-ignore -->
```css
a {

  --foo: pink; /* comment */
  --bar: red;
}
```

#### `"first-nested"`

Reverse the primary option for custom properties that are nested and the first child of their parent node.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {

  --foo: pink;

  --bar: red;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  --foo: pink;

  --bar: red;
}
```

### `ignore: ["after-comment", "first-nested", "inside-single-line-block"]`

#### `"after-comment"`

Ignore custom properties that follow a comment.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  /* comment */
  --foo: pink;
}
```

#### `"first-nested"`

Ignore custom properties that are nested and the first child of their parent node.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  --foo: pink;

  --bar: red;
}
```

#### `"inside-single-line-block"`

Ignore custom properties that are inside single-line blocks.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { --foo: pink; --bar: red; }
```
