# selector-attribute-operator-space-before

Require a single space or disallow whitespace before operators within attribute selectors.

<!-- prettier-ignore -->
```css
[target =_blank]
/**     ↑
 * The space before operator */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the operator.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
[target=_blank] {}
```

<!-- prettier-ignore -->
```css
[target= _blank] {}
```

<!-- prettier-ignore -->
```css
[target='_blank'] {}
```

<!-- prettier-ignore -->
```css
[target="_blank"] {}
```

<!-- prettier-ignore -->
```css
[target= '_blank'] {}
```

<!-- prettier-ignore -->
```css
[target= "_blank"] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
[target] {}
```

<!-- prettier-ignore -->
```css
[target =_blank] {}
```

<!-- prettier-ignore -->
```css
[target ='_blank'] {}
```

<!-- prettier-ignore -->
```css
[target ="_blank"] {}
```

<!-- prettier-ignore -->
```css
[target = _blank] {}
```

<!-- prettier-ignore -->
```css
[target = '_blank'] {}
```

<!-- prettier-ignore -->
```css
[target = "_blank"] {}
```

### `"never"`

There _must never_ be a single space before the operator.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
[target =_blank] {}
```

<!-- prettier-ignore -->
```css
[target = _blank] {}
```

<!-- prettier-ignore -->
```css
[target ='_blank'] {}
```

<!-- prettier-ignore -->
```css
[target ="_blank"] {}
```

<!-- prettier-ignore -->
```css
[target = '_blank'] {}
```

<!-- prettier-ignore -->
```css
[target = "_blank"] {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
[target] {}
```

<!-- prettier-ignore -->
```css
[target=_blank] {}
```

<!-- prettier-ignore -->
```css
[target='_blank'] {}
```

<!-- prettier-ignore -->
```css
[target="_blank"] {}
```

<!-- prettier-ignore -->
```css
[target= _blank] {}
```

<!-- prettier-ignore -->
```css
[target= '_blank'] {}
```

<!-- prettier-ignore -->
```css
[target= "_blank"] {}
```
