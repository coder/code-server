# function-url-quotes

Require or disallow quotes for urls.

<!-- prettier-ignore -->
```css
a { background: url("x.jpg") }
/**                 ↑     ↑
 *             These quotes */
```

## Options

`string`: `"always"|"never"`

### `"always"`

Urls _must always_ be quoted.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@import url(foo.css);
```

<!-- prettier-ignore -->
```css
@document domain(http://www.w3.org/);
```

<!-- prettier-ignore -->
```css
@font-face { font-family: 'foo'; src: url(foo.ttf); }
```

<!-- prettier-ignore -->
```css
@-moz-document url-prefix() {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { background: url('x.jpg'); }
```

<!-- prettier-ignore -->
```css
@import url("foo.css");
```

<!-- prettier-ignore -->
```css
@document domain('http://www.w3.org/');
```

<!-- prettier-ignore -->
```css
@font-face { font-family: "foo"; src: url("foo.ttf"); }
```

<!-- prettier-ignore -->
```css
@-moz-document url-prefix('') {}
```

### `"never"`

Urls _must never_ be quoted.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { background: url('x.jpg'); }
```

<!-- prettier-ignore -->
```css
@import url("foo.css");
```

<!-- prettier-ignore -->
```css
@font-face { font-family: "foo"; src: url('foo.ttf'); }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { background: url(x.jpg); }
```

<!-- prettier-ignore -->
```css
@import url(foo.css);
```

<!-- prettier-ignore -->
```css
@font-face { font-family: 'foo'; src: url(foo.ttf); }
```

## Optional secondary options

### `except: ["empty"]`

Reverse the primary option for functions that have no arguments.

For example, with `"always"`.

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@-moz-document url-prefix() {}
```
