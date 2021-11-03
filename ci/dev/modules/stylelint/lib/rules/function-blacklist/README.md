# function-blacklist

**_Deprecated: Instead use the [`function-disallowed-list`](../function-disallowed-list/README.md) rule._**

Specify a list of disallowed functions.

<!-- prettier-ignore -->
```css
a { transform: scale(1); }
/**            ↑
 * This function */
```

## Options

`array|string`: `["array", "of", "unprefixed", /functions/ or "regex"]|"function"|"/regex/"`

If a string is surrounded with `"/"` (e.g. `"/^rgb/"`), it is interpreted as a regular expression.

Given:

```
["scale", "rgba", "linear-gradient"]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { transform: scale(1); }
```

<!-- prettier-ignore -->
```css
a {
  color: rgba(0, 0, 0, 0.5);
}
```

<!-- prettier-ignore -->
```css
a {
  background:
    red,
    -moz-linear-gradient(45deg, blue, red);
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { background: red; }
```
