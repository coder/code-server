# color-no-invalid-hex

Disallow invalid hex colors.

<!-- prettier-ignore -->
```css
a { color: #y3 }
/**        ↑
 * This hex color */
```

Longhand hex colors can be either 6 or 8 (with alpha channel) hexadecimal characters. And their shorthand variants are 3 and 4 characters respectively.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { color: #00; }
```

<!-- prettier-ignore -->
```css
a { color: #fff1az; }
```

<!-- prettier-ignore -->
```css
a { color: #12345aa; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { color: #000; }
```

<!-- prettier-ignore -->
```css
a { color: #000f; }
```

<!-- prettier-ignore -->
```css
a { color: #fff1a0; }
```

<!-- prettier-ignore -->
```css
a { color: #123450aa; }
```
