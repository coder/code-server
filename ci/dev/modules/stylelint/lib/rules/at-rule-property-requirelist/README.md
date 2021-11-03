# at-rule-property-requirelist

**_Deprecated: Instead use the [`at-rule-property-required-list`](../at-rule-property-required-list/README.md) rule._**

Specify a list of required properties for an at-rule.

<!-- prettier-ignore -->
```css
    @font-face { font-display: swap; font-family: 'foo'; }
/**  ↑           ↑                   ↑
 *  At-rule and required property names */
```

## Options

`object`: `{ "at-rule-name": ["array", "of", "properties"] }`

Given:

```
{
  "font-face": ["font-display", "font-family", "font-style"]
}
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@font-face {
    font-family: 'foo';
    src: url('./fonts/foo.woff2') format('woff2');
}
```

<!-- prettier-ignore -->
```css
@font-face {
    font-family: 'foo';
    font-style: normal;
    src: url('./fonts/foo.woff2') format('woff2');
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@font-face {
    font-display: swap;
    font-family: 'foo';
    font-style: normal;
    src: url('./fonts/foo.woff2') format('woff2');
}
```
