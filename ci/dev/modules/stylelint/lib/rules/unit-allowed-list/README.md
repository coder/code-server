# unit-allowed-list

Specify a list of allowed units.

<!-- prettier-ignore -->
```css
a { width: 100px; }
/**           ↑
 *  These units */
```

## Options

`array|string`: `["array", "of", "units"]|"unit"`

Given:

```
["px", "em", "deg"]
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { width: 100%; }
```

<!-- prettier-ignore -->
```css
a { font-size: 10rem; }
```

<!-- prettier-ignore -->
```css
a { animation: animation-name 5s ease; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { font-size: 1.2em; }
```

<!-- prettier-ignore -->
```css
a { line-height: 1.2; }
```

<!-- prettier-ignore -->
```css
a { height: 100px; }
```

<!-- prettier-ignore -->
```css
a { height: 100PX; }
```

<!-- prettier-ignore -->
```css
a { transform: rotate(30deg); }
```

## Optional secondary options

### `ignoreProperties: { unit: ["property", "/regex/", /regex/] }`

Ignore units in the values of declarations with the specified properties.

For example, with `["px", "em"]`.

Given:

```
{
  "rem": [ "line-height", "/^border/" ],
  "%": [ "width" ]
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { line-height: 0.1rem; }
```

<!-- prettier-ignore -->
```css
a { border-bottom-width: 6rem; }
```

<!-- prettier-ignore -->
```css
a { width: 100%; }
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { margin: 0 20rem; }
```

<!-- prettier-ignore -->
```css
a { -moz-border-radius-topright: 20rem; }
```

<!-- prettier-ignore -->
```css
a { height: 100%; }
```
