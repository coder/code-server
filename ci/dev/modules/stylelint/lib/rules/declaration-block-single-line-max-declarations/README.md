# declaration-block-single-line-max-declarations

Limit the number of declarations within a single-line declaration block.

<!-- prettier-ignore -->
```css
a { color: pink; top: 0; }
/** ↑            ↑
 * The number of these declarations */
```

## Options

`int`: Maximum number of declarations allowed.

For example, with `1`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; top: 3px; }
```

<!-- prettier-ignore -->
```css
a,
b { color: pink; top: 3px; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: pink; }
```

<!-- prettier-ignore -->
```css
a,
b { color: pink; }
```

<!-- prettier-ignore -->
```css
a {
  color: pink;
  top: 3px;
}
```
