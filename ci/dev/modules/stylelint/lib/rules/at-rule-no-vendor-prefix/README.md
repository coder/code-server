# at-rule-no-vendor-prefix

Disallow vendor prefixes for at-rules.

<!-- prettier-ignore -->
```css
    @-webkit-keyframes { 0% { top: 0; } }
/**  ↑
 * This prefix */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@-webkit-keyframes { 0% { top: 0; } }
```

<!-- prettier-ignore -->
```css
@-ms-viewport { orientation: landscape; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@keyframes { 0% { top: 0; } }
```

<!-- prettier-ignore -->
```css
@viewport { orientation: landscape; }
```
