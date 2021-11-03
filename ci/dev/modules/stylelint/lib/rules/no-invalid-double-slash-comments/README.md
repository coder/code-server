# no-invalid-double-slash-comments

Disallow double-slash comments (`//...`) which are not supported by CSS and [could lead to unexpected results](https://stackoverflow.com/a/20192639/130652).

<!-- prettier-ignore -->
```css
a {
  //color: pink;
}
/** ↑
 *  This comment */
```

If you are using a preprocessor that allows `//` single-line comments (e.g. Sass, Less, Stylus), this rule will not complain about those. They are compiled into standard CSS comments by your preprocessor, so stylelint will consider them valid. This rule only complains about the lesser-known method of using `//` to "comment out" a single-line of code in regular CSS. (If you didn't know this was possible, have a look at ["Single Line Comments (//) in CSS"](http://www.xanthir.com/b4U10)).

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  //color: pink;
}
```

<!-- prettier-ignore -->
```css
//a { color: pink; }
```

<!-- prettier-ignore -->
```css
// Comment {}
a {
  color: pink;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  /* color: pink; */
}
```

<!-- prettier-ignore -->
```css
/* a { color: pink;  } */
```
