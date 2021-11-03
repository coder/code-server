# unit-blacklist

**_Deprecated: Instead use the [`unit-disallowed-list`](../unit-disallowed-list/README.md) rule._**

Specify a list of disallowed units.

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
a { width: 100px; }
```

<!-- prettier-ignore -->
```css
a { font-size: 10em; }
```

<!-- prettier-ignore -->
```css
a { transform: rotate(30deg); }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { font-size: 1.2rem; }
```

<!-- prettier-ignore -->
```css
a { line-height: 1.2; }
```

<!-- prettier-ignore -->
```css
a { height: 100vmin; }
```

<!-- prettier-ignore -->
```css
a { animation: animation-name 5s ease; }
```

## Optional secondary options

### `ignoreProperties: { unit: ["property", "/regex/", /regex/] }`

Ignore units in the values of declarations with the specified properties.

For example, with `["px", "vmin"]`.

Given:

```
{
  "px": [ "font-size", "/^border/" ],
  "vmin": [ "width" ]
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { font-size: 13px; }
```

<!-- prettier-ignore -->
```css
a { border-bottom-width: 6px; }
```

<!-- prettier-ignore -->
```css
a { width: 100vmin; }
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { line-height: 12px; }
```

<!-- prettier-ignore -->
```css
a { -moz-border-radius-topright: 40px; }
```

<!-- prettier-ignore -->
```css
a { height: 100vmin; }
```

### `ignoreMediaFeatureNames: { unit: ["property", "/regex/", /regex/] }`

Ignore units for specific feature names.

For example, with `["px", "dpi"]`.

Given:

```
{
  "px": [ "min-width", "/height$/" ],
  "dpi": [ "resolution" ]
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media (min-width: 960px) {}
```

<!-- prettier-ignore -->
```css
@media (max-height: 280px) {}
```

<!-- prettier-ignore -->
```css
@media not (resolution: 300dpi) {}
```

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (max-device-width: 500px) {}
```

<!-- prettier-ignore -->
```css
@media all and (min-width: 500px) and (max-width: 200px) {}
```

<!-- prettier-ignore -->
```css
@media print and (max-resolution: 100dpi) {}
```
