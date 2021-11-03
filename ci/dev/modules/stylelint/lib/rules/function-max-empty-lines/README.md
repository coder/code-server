# function-max-empty-lines

Limit the number of adjacent empty lines within functions.

<!-- prettier-ignore -->
```css
a {
  transform:
    translate(
                /* ← */
      1,        /* ↑ */
                /* ← */
      1         /* ↑ */
                /* ← */
    );          /* ↑ */
}               /* ↑ */
/**                ↑
 *            These lines */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`int`: Maximum number of adjacent empty lines allowed.

For example, with `0`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  transform:
    translate(

      1,
      1
    );
}
```

<!-- prettier-ignore -->
```css
a {
  transform:
    translate(
      1,

      1
    );
}
```

<!-- prettier-ignore -->
```css
a {
  transform:
    translate(
      1,
      1

    );
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  transform:
    translate(
      1,
      1
    );
}
```
