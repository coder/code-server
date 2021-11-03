# function-url-no-scheme-relative

Disallow scheme-relative urls.

<!-- prettier-ignore -->
```css
a { background-image: url('//www.google.com/file.jpg'); }
/**                        ↑
 *  This scheme-relative url */
```

A [scheme-relative url](https://url.spec.whatwg.org/#syntax-url-scheme-relative) is a url that begins with `//` followed by a host.

This rule ignores url arguments that are variables (`$sass`, `@less`, `--custom-property`).

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  background: url("//www.google.com/file.jpg");
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  background: url("../file.jpg");
}
```

<!-- prettier-ignore -->
```css
a {
  background: url("http://www.google.com/file.jpg");
}
```

<!-- prettier-ignore -->
```css
a {
  background: url("/path/to/file.jpg");
}
```
