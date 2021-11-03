# block-opening-brace-newline-after

Require a newline after the opening brace of blocks.

<!-- prettier-ignore -->
```css
  a {
    ↑ color: pink; }
/** ↑
 * The newline after this brace */
```

This rule allows an end-of-line comment followed by a newline. For example,

<!-- prettier-ignore -->
```css
a { /* end-of-line comment */
  color: pink;
}
```

Refer to [combining rules](../../../docs/user-guide/rules/combine.md) for more information on using this rule with [`block-opening-brace-newline-before`](../block-opening-brace-newline-before/README.md) to disallow single-line rules.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline after the opening brace.

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

<!-- prettier-ignore -->
```css
a{ /* end-of-line comment
  with a newline */
  color: pink;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
color: pink; }
```

<!-- prettier-ignore -->
```css
a
{
color: pink; }
```

<!-- prettier-ignore -->
```css
a { /* end-of-line comment */
  color: pink;
}
```

### `"always-multi-line"`

There _must always_ be a newline after the opening brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a{color: pink;
}
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

### `"never-multi-line"`

There _must never_ be whitespace after the opening brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a {color: pink;
}
```
