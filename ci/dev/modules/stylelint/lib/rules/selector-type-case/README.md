# selector-type-case

Specify lowercase or uppercase for type selectors.

<!-- prettier-ignore -->
```css
    a {}
/** ↑
 * This is type selector */
```

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
A {}
```

<!-- prettier-ignore -->
```css
LI {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {}
```

<!-- prettier-ignore -->
```css
li {}
```

### `"upper"`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {}
```

<!-- prettier-ignore -->
```css
li {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
A {}
```

<!-- prettier-ignore -->
```css
LI {}
```

## Optional secondary options

### `ignoreTypes: ["/regex/", "non-regex"]`

Given:

```
["$childClass", "/(p|P)arent.*/"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
myParentClass {
  color: pink;
}

$childClass {
  color: pink;
}
```
