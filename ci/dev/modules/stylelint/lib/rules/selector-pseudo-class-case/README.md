# selector-pseudo-class-case

Specify lowercase or uppercase for pseudo-class selectors.

<!-- prettier-ignore -->
```css
  a:hover {}
/** ↑
 * This pseudo-class selector */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a:Hover {}
```

<!-- prettier-ignore -->
```css
a:hOvEr {}
```

<!-- prettier-ignore -->
```css
a:HOVER {}
```

<!-- prettier-ignore -->
```css
:ROOT {}
```

<!-- prettier-ignore -->
```css
:-MS-INPUT-PLACEHOLDER {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a:hover {}
```

<!-- prettier-ignore -->
```css
:root {}
```

<!-- prettier-ignore -->
```css
:-ms-input-placeholder {}
```

### `"upper"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a:Hover {}
```

<!-- prettier-ignore -->
```css
a:hOvEr {}
```

<!-- prettier-ignore -->
```css
a:hover {}
```

<!-- prettier-ignore -->
```css
:root {}
```

<!-- prettier-ignore -->
```css
:-ms-input-placeholder {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a:HOVER {}
```

<!-- prettier-ignore -->
```css
:ROOT {}
```

<!-- prettier-ignore -->
```css
:-MS-INPUT-PLACEHOLDER {}
```
