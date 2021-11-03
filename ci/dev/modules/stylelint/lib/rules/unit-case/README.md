# unit-case

Specify lowercase or uppercase for units.

<!-- prettier-ignore -->
```css
    a { width: 10px; }
/**              ↑
 *     These units */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix most of the problems reported by this rule.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  width: 10PX;
}
```

<!-- prettier-ignore -->
```css
a {
  width: 10Px;
}
```

<!-- prettier-ignore -->
```css
a {
  width: 10pX;
}
```

<!-- prettier-ignore -->
```css
a {
  width: 10PIXEL;
}
```

<!-- prettier-ignore -->
```css
a {
  width: calc(10PX * 2);
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  width: 10px;
}
```

<!-- prettier-ignore -->
```css
a {
  width: calc(10px * 2);
}
```

### `"upper"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  width: 10px;
}
```

<!-- prettier-ignore -->
```css
a {
  width: 10Px;
}
```

<!-- prettier-ignore -->
```css
a {
  width: 10pX;
}
```

<!-- prettier-ignore -->
```css
a {
  width: 10pixel;
}
```

<!-- prettier-ignore -->
```css
a {
  width: calc(10px * 2);
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  width: 10PX;
}
```

<!-- prettier-ignore -->
```css
a {
  width: calc(10PX * 2);
}
```
