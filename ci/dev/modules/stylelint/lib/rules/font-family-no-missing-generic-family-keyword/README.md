# font-family-no-missing-generic-family-keyword

Disallow missing generic families in lists of font family names.

<!-- prettier-ignore -->
```css
a { font-family: Arial, sans-serif; }
/**                     ↑
 * An example of generic family name */
```

The generic font family can be:

- placed anywhere in the font family list
- omitted if a keyword related to property inheritance or a system font is used

This rule checks the `font` and `font-family` properties.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { font-family: Helvetica, Arial, Verdana, Tahoma; }
```

<!-- prettier-ignore -->
```css
a { font: 1em/1.3 Times; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { font-family: Helvetica, Arial, Verdana, Tahoma, sans-serif; }
```

<!-- prettier-ignore -->
```css
a { font: 1em/1.3 Times, serif, Apple Color Emoji; }
```

<!-- prettier-ignore -->
```css
a { font: inherit; }
```

<!-- prettier-ignore -->
```css
a { font: caption; }
```

<!-- prettier-ignore -->
```css
a { font-family: var(--font-family-common); }
```

<!-- prettier-ignore -->
```css
a { font-family: Helvetica, var(--font-family-common); }
```

## Optional secondary options

### `ignoreFontFamilies: ["/regex/", /regex/, "string"]`

Given:

```
["custom-font"]
```

The following pattern is _not_ considered a violation:

<!-- prettier-ignore -->
```css
a { font-family: custom-font; }
```

The following pattern is considered a violation:

<!-- prettier-ignore -->
```css
a { font-family: invalid-custom-font; }
```
