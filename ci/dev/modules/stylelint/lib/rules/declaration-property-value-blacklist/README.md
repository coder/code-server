# declaration-property-value-blacklist

**_Deprecated: Instead use the [`declaration-property-value-disallowed-list`](../declaration-property-value-disallowed-list/README.md) rule._**

Specify a list of disallowed property and value pairs within declarations.

<!-- prettier-ignore -->
```css
a { text-transform: uppercase; }
/** ↑               ↑
 * These properties and these values */
```

## Options

`object`: `{ "unprefixed-property-name": ["array", "of", "values"], "unprefixed-property-name": ["/regex/", "non-regex", /regex/] }`

If a property name is surrounded with `"/"` (e.g. `"/^animation/"`), it is interpreted as a regular expression. This allows, for example, easy targeting of shorthands: `/^animation/` will match `animation`, `animation-duration`, `animation-timing-function`, etc.

The same goes for values. Keep in mind that a regular expression value is matched against the entire value of the declaration, not specific parts of it. For example, a value like `"10px solid rgba( 255 , 0 , 0 , 0.5 )"` will _not_ match `"/^solid/"` (notice beginning of the line boundary) but _will_ match `"/\\s+solid\\s+/"` or `"/\\bsolid\\b/"`.

Be careful with regex matching not to accidentally consider quoted string values and `url()` arguments. For example, `"/red/"` will match value such as `"1px dotted red"` as well as `"\"foo\""` and `"white url(/mysite.com/red.png)"`.

Given:

```
{
  "transform": ["/scale3d/", "/rotate3d/", "/translate3d/"],
  "position": ["fixed"],
  "color": ["/^green/"],
  "/^animation/": ["/ease/"]
}
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { position: fixed; }
```

<!-- prettier-ignore -->
```css
a { transform: scale3d(1, 2, 3); }
```

<!-- prettier-ignore -->
```css
a { -webkit-transform: scale3d(1, 2, 3); }
```

<!-- prettier-ignore -->
```css
a { color: green; }
```

<!-- prettier-ignore -->
```css
a { animation: foo 2s ease-in-out; }
```

<!-- prettier-ignore -->
```css
a { animation-timing-function: ease-in-out; }
```

<!-- prettier-ignore -->
```css
a { -webkit-animation-timing-function: ease-in-out; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { position: relative; }
```

<!-- prettier-ignore -->
```css
a { transform: scale(2); }
```

<!-- prettier-ignore -->
```css
a { -webkit-transform: scale(2); }
```

<!-- prettier-ignore -->
```css
a { color: lightgreen; }
```

<!-- prettier-ignore -->
```css
a { animation: foo 2s linear; }
```

<!-- prettier-ignore -->
```css
a { animation-timing-function: linear; }
```

<!-- prettier-ignore -->
```css
a { -webkit-animation-timing-function: linear; }
```
