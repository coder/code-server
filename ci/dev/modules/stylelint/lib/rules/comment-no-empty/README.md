# comment-no-empty

Disallow empty comments.

<!-- prettier-ignore -->
```css
    /* */
/** ↑
 * Comments like this */
```

This rule ignores SCSS-like comments.

**Caveat:** Comments within _selector and value lists_ are currently ignored.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
/**/
```

<!-- prettier-ignore -->
```css
/* */
```

<!-- prettier-ignore -->
```css
/*

 */
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
/* comment */
```

<!-- prettier-ignore -->
```css
/*
 * Multi-line Comment
**/
```
