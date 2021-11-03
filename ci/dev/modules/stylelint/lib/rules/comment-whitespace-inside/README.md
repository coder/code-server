# comment-whitespace-inside

Require or disallow whitespace on the inside of comment markers.

<!-- prettier-ignore -->
```css
    /* comment */
/**  ↑         ↑
 * The space inside these two markers */
```

Any number of asterisks are allowed at the beginning or end of the comment. So `/** comment **/` is treated the same way as `/* comment */`.

**Caveat:** Comments within _selector and value lists_ are currently ignored.

The [`fix` option](../../../docs/user-guide/usage/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be whitespace inside the markers.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
/*comment*/
```

<!-- prettier-ignore -->
```css
/*comment */
```

<!-- prettier-ignore -->
```css
/** comment**/
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/* comment */
```

<!-- prettier-ignore -->
```css
/** comment **/
```

<!-- prettier-ignore -->
```css
/**
 * comment
 */
```

<!-- prettier-ignore -->
```css
/*     comment
*/
```

### `"never"`

There _must never_ be whitespace on the inside the markers.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
/* comment */
```

<!-- prettier-ignore -->
```css
/*comment */
```

<!-- prettier-ignore -->
```css
/** comment**/
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/*comment*/
```

<!-- prettier-ignore -->
```css
/****comment****/
```
