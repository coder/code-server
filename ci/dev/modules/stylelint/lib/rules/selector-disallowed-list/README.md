# selector-disallowed-list

Specify a list of disallowed selectors.

<!-- prettier-ignore -->
```css
    .foo > .bar
/** ↑
 * This is selector */
```

## Options

`array|string|regexp`: `["array", "of", "selectors", /or/, "/regex/"]|"selector"|"/regex/"`

If a string is surrounded with `"/"` (e.g. `"/\.foo/"`), it is interpreted as a regular expression.

Given:

```
["a > .foo", /\[data-.+]/]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a > .foo {}
```

<!-- prettier-ignore -->
```css
a[data-auto="1"] {}
```

<!-- prettier-ignore -->
```css
.foo, [data-auto="1"] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
.foo {}
```

<!-- prettier-ignore -->
```css
a
>
.foo {}
```

<!-- prettier-ignore -->
```css
.bar > a > .foo {}
```

<!-- prettier-ignore -->
```css
.data-auto {}
```

<!-- prettier-ignore -->
```css
a[href] {}
```
