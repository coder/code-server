# font-family-no-duplicate-names

Disallow duplicate font family names.

<!-- prettier-ignore -->
```css
a { font-family: serif, serif; }
/**              ↑      ↑
 * These font family names */
```

This rule checks the `font` and `font-family` properties.

This rule ignores `$sass`, `@less`, and `var(--custom-property)` variable syntaxes.

**Caveat:** This rule will stumble on _unquoted_ multi-word font names and _unquoted_ font names containing escape sequences. Wrap these font names in quotation marks, and everything should be fine.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { font-family: 'Times', Times, serif; }
```

<!-- prettier-ignore -->
```css
a { font: 1em "Arial", 'Arial', sans-serif; }
```

<!-- prettier-ignore -->
```css
a { font: normal 14px/32px -apple-system, BlinkMacSystemFont, sans-serif, sans-serif; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { font-family: Times, serif; }
```

<!-- prettier-ignore -->
```css
a { font: 1em "Arial", "sans-serif", sans-serif; }
```

<!-- prettier-ignore -->
```css
a { font: normal 14px/32px -apple-system, BlinkMacSystemFont, sans-serif; }
```

## Optional secondary options

### `ignoreFontFamilyNames: ["/regex/", /regex/, "string"]`

Given:

```
["/^My Font /", "monospace"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
font-family: monospace, monospace
```

<!-- prettier-ignore -->
```css
font-family: "My Font Family", "My Font Family", monospace
```
