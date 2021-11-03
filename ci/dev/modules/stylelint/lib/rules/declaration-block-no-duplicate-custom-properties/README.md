# declaration-block-no-duplicate-custom-properties

Disallow duplicate custom properties within declaration blocks.

<!-- prettier-ignore -->
```css
a { --custom-property: pink; --custom-property: orange; }
/** ↑                        ↑
 * These duplicated custom properties */
```

This rule is case-sensitive.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { --custom-property: pink; --custom-property: orange; }
```

<!-- prettier-ignore -->
```css
a { --custom-property: pink; background: orange; --custom-property: orange }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { --custom-property: pink; }
```

<!-- prettier-ignore -->
```css
a { --custom-property: pink; --cUstOm-prOpErtY: orange; }
```
