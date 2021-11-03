# block-closing-brace-space-after

Require a single space or disallow whitespace after the closing brace of blocks.

<!-- prettier-ignore -->
```css
a { color: pink; }
/**              ↑
 * The space after this brace */
```

This rule allows a trailing semicolon after the closing brace of a block. For example,

<!-- prettier-ignore -->
```css
:root {
  --toolbar-theme: {
    background-color: hsl(120, 70%, 95%);
  };
/* ↑
 * This semicolon */
}
```

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a single space after the closing brace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink; }
b { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; } b { color: red; }
```

### `"never"`

There _must never_ be whitespace after the closing brace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; } b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink; }
b { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink;
}b { color: red; }
```

### `"always-single-line"`

There _must always_ be a single space after the closing brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }b { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; } b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink;
}b { color: red; }
```

### `"never-single-line"`

There _must never_ be whitespace after the closing brace in single-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; } b { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink;
} b { color: red; }
```

### `"always-multi-line"`

There _must always_ be a single space after the closing brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;
}b { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink;
} b { color: red; }
```

### `"never-multi-line"`

There _must never_ be whitespace after the closing brace in multi-line blocks.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink;
} b { color: red; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; } b { color: red; }
```

<!-- prettier-ignore -->
```css
a { color: pink;
}b { color: red; }
```
