# number-max-precision

Limit the number of decimal places allowed in numbers.

<!-- prettier-ignore -->
```css
a { top: 3.245634px; }
/**           ↑
 * This decimal place */
```

## Options

`int`: Maximum number of decimal places allowed.

For example, with `2`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { top: 3.245px; }
```

<!-- prettier-ignore -->
```css
a { top: 3.245634px; }
```

<!-- prettier-ignore -->
```css
@media (min-width: 3.234em) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { top: 3.24px; }
```

<!-- prettier-ignore -->
```css
@media (min-width: 3.23em) {}
```

## Optional secondary options

### `ignoreUnits: ["/regex/", /regex/, "string"]`

Ignore the precision of numbers for values with the specified units.

For example, with `2`.

Given:

```
["/^my-/", "%"]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { top: 3.245px; }
```

<!-- prettier-ignore -->
```css
a { top: 3.245634px; }
```

<!-- prettier-ignore -->
```css
@media (min-width: 3.234em) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { top: 3.245%; }
```

<!-- prettier-ignore -->
```css
@media (min-width: 3.23em) {}
```

<!-- prettier-ignore -->
```css
a {
  width: 10.5432%;
}
```

<!-- prettier-ignore -->
```css
a { top: 3.245my-unit; }
```

<!-- prettier-ignore -->
```css
a {
  width: 10.989my-other-unit;
}
```
