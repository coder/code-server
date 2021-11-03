# no-duplicate-at-import-rules

Disallow duplicate `@import` rules within a stylesheet.

<!-- prettier-ignore -->
```css
    @import "a.css";
    @import "a.css";
/** ↑
 * These are duplicates */
```

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@import 'a.css';
@import 'a.css';
```

<!-- prettier-ignore -->
```css
@import url("a.css");
@import url("a.css");
```

<!-- prettier-ignore -->
```css
@import "a.css";
@import 'a.css';
```

<!-- prettier-ignore -->
```css
@import "a.css";
@import 'b.css';
@import url(a.css);
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@import "a.css";
@import "b.css";
```

<!-- prettier-ignore -->
```css
@import url('a.css') projection;
@import url('a.css') tv;
```
