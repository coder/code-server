# at-rule-empty-line-before

Require or disallow an empty line before at-rules.

<!-- prettier-ignore -->
```css
a {}
          /* ← */
@media {} /* ↑ */
/**          ↑
 *   This line */
```

This rule ignores:

- at-rules that are the very first node in the source
- `@import` in Less.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule. We recommend to enable [`indentation`](../indentation/README.md) rule for better autofixing results with this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be an empty line before at-rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {} @media {}
```

<!-- prettier-ignore -->
```css
a {}
@media {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {}

@media {}
```

### `"never"`

There _must never_ be an empty line before at-rules.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {}

@media {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {} @media {}
```

<!-- prettier-ignore -->
```css
a {}
@media {}
```

## Optional secondary options

### `except: ["after-same-name", "inside-block", "blockless-after-same-name-blockless", "blockless-after-blockless", "first-nested"]`

#### `"after-same-name"`

Reverse the primary option for at-rules that follow another at-rule with the same name.

This means that you can group your at-rules by name.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";

@import url(x.css);
@import url(y.css);

@media (min-width: 100px) {}
@media (min-width: 200px) {}
```

<!-- prettier-ignore -->
```css
a {

  @extends .foo;
  @extends .bar;

  @include x;
  @include y {}
}
```

#### `"inside-block"`

Reverse the primary option for at-rules that are inside a block.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {

  @extend foo;
  color: pink;
}

b {
  color: pink;

  @extend foo;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  @extend foo;
  color: pink;
}

b {
  color: pink;
  @extend foo;
}
```

#### `"blockless-after-same-name-blockless"`

Reverse the primary option for blockless at-rules that follow another blockless at-rule with the same name.

This means that you can group your blockless at-rules by name.

Shared-line comments do not affect this option.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";

@import url(x.css);
@import url(y.css);
```

<!-- prettier-ignore -->
```css
@charset "UTF-8";

@import url(x.css); /* comment */
@import url(y.css);
```

<!-- prettier-ignore -->
```css
a {

  @extends .foo;
  @extends .bar;

  @include loop;
  @include doo;
}
```

#### `"blockless-after-blockless"`

Reverse the primary option for blockless at-rules that follow another blockless at-rule.

Shared-line comments do not affect this option.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@import url(x.css);

@import url(y.css);

@media print {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@import url(x.css);
@import url(y.css);

@media print {}
```

<!-- prettier-ignore -->
```css
@import url(x.css); /* comment */
@import url(y.css);

@media print {}
```

#### `"first-nested"`

Reverse the primary option for at-rules that are nested and the first child of their parent node.

For example, with `"always"`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {

  @extend foo;
  color: pink;
}

b {
  color: pink;
  @extend foo;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  @extend foo;
  color: pink;
}

b {
  color: pink;

  @extend foo;
}
```

### `ignore: ["after-comment", "first-nested", "inside-block", "blockless-after-same-name-blockless", "blockless-after-blockless"]`

#### `"after-comment"`

Ignore at-rules that follow a comment.

Shared-line comments do not trigger this option.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/* comment */
@media {}
```

<!-- prettier-ignore -->
```css
/* comment */

@media {}
```

<!-- prettier-ignore -->
```css
@media {} /* comment */

@media {}
```

#### `"first-nested"`

Ignore at-rules that are nested and the first child of their parent node.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@supports {
  @media {}

  @media {}
}
```

#### `"inside-block"`

Ignore at-rules that are inside a block.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  @extend foo;
  color: pink;
}

a {

  @extend foo;
  color: pink;
}

b {
  color: pink;
  @extend foo;
}

b {
  color: pink;

  @extend foo;
}
```

#### `"blockless-after-same-name-blockless"`

Ignore blockless at-rules that follow another blockless at-rule with the same name.

This means that you can group your blockless at-rules by name.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css

@charset "UTF-8";

@import url(x.css);
@import url(y.css);
```

<!-- prettier-ignore -->
```css
a {

  @extends .foo;
  @extends .bar;

  @include loop;
  @include doo;
}
```

#### `"blockless-after-blockless"`

Ignore blockless at-rules that follow another blockless at-rule.

For example, with `"always"`:

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@import url(x.css);

@import url(y.css);

@media print {}
```

<!-- prettier-ignore -->
```css
@import url(x.css);
@import url(y.css);

@media print {}
```

### `ignoreAtRules: ["array", "of", "at-rules"]`

Ignore specified at-rules.

For example, with `"always"`.

Given:

```
["import"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@charset "UTF-8";
@import {}
```
