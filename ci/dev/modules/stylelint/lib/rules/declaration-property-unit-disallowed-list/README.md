# declaration-property-unit-disallowed-list

Specify a list of disallowed property and unit pairs within declarations.

<!-- prettier-ignore -->
```css
a { width: 100px; }
/** ↑         ↑
 * These properties and these units */
```

## Options

`object`: `{ "unprefixed-property-name": ["array", "of", "units"] }`

If a property name is surrounded with `"/"` (e.g. `"/^animation/"`), it is interpreted as a regular expression. This allows, for example, easy targeting of shorthands: `/^animation/` will match `animation`, `animation-duration`, `animation-timing-function`, etc.

Given:

```
{
  "font-size": ["em", "px"],
  "/^animation/": ["s"]
}
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { font-size: 1em; }
```

<!-- prettier-ignore -->
```css
a { animation: animation-name 5s ease; }
```

<!-- prettier-ignore -->
```css
a { -webkit-animation: animation-name 5s ease; }
```

<!-- prettier-ignore -->
```css
a { animation-duration: 5s; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { font-size: 1.2rem; }
```

<!-- prettier-ignore -->
```css
a { height: 100px; }
```

<!-- prettier-ignore -->
```css
a { animation: animation-name 500ms ease; }
```

<!-- prettier-ignore -->
```css
a { -webkit-animation: animation-name 500ms ease; }
```

<!-- prettier-ignore -->
```css
a { animation-duration: 500ms; }
```
