# value-list-max-empty-lines

Limit the number of adjacent empty lines within value lists.

<!-- prettier-ignore -->
```css
a {
  box-shadow:
    inset 0 2px 0 #dcffa6,
                    /* ← */
    0 2px 5px #000; /* ↑ */
}                   /* ↑ */
/**                    ↑
 *       This empty line */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`int`: Maximum number of adjacent empty lines allowed.

For example, with `0`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  padding: 10px

    10px
    10px
    10px
}
```

<!-- prettier-ignore -->
```css
a {
  padding:
    10px
    10px
    10px

    10px
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow: inset 0 2px 0 #dcffa6,

    0 2px 5px #000;
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow:
    inset 0 2px 0 #dcffa6,

    0 2px 5px #000;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  padding: 10px 10px 10px 10px
}
```

<!-- prettier-ignore -->
```css
a {
  padding: 10px
    10px
    10px
    10px
}
```

<!-- prettier-ignore -->
```css
a {
  padding:
    10px
    10px
    10px
    10px
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow: inset 0 2px 0 #dcffa6, 0 2px 5px #000;
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow: inset 0 2px 0 #dcffa6,
    0 2px 5px #000;
}
```

<!-- prettier-ignore -->
```css
a {
  box-shadow:
    inset 0 2px 0 #dcffa6,
    0 2px 5px #000;
}
```
