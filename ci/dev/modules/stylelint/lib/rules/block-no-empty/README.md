# block-no-empty

Disallow empty blocks.

<!-- prettier-ignore -->
```css
 a { }
/** ↑
 * Blocks like this */
```

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {}
```

<!-- prettier-ignore -->
```css
a { }
```

<!-- prettier-ignore -->
```css
@media print {
  a {}
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  /* foo */
}
```

<!-- prettier-ignore -->
```css
@media print {
  a {
    color: pink;
  }
}
```

## Optional secondary options

### `ignore: ["comments"]`

Exclude comments from being treated as content inside of a block.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  /* foo */
}
```

<!-- prettier-ignore -->
```css
@media print {
  a {
    /* foo */
  }
}
```
