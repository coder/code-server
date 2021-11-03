# selector-attribute-operator-disallowed-list

Specify a list of disallowed attribute operators.

<!-- prettier-ignore -->
```css
[target="_blank"] {}
/**    ↑
 * This operator */
```

## Options

`array|string`: `["array", "of", "operators"]|"operator"`

Given:

```
["*="]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
[class*="test"] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
[target] {}
```

<!-- prettier-ignore -->
```css
[target="_blank"] {}
```

<!-- prettier-ignore -->
```css
[class|="top"] {}
```
