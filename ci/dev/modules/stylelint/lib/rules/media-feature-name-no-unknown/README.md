# media-feature-name-no-unknown

Disallow unknown media feature names.

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
/**     ↑
 * This media feature name */
```

This rule considers media feature names defined in the CSS Specifications, up to and including Editor's Drafts, to be known.

This rule ignores vendor-prefixed media feature names.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
@media screen and (unknown) {}
```

<!-- prettier-ignore -->
```css
@media screen and (unknown: 10px) {}
```

<!-- prettier-ignore -->
```css
@media screen and (unknown > 10px) {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media all and (monochrome) {}
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) {}
```

<!-- prettier-ignore -->
```css
@media (MIN-WIDTH: 700px) {}
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and (orientation: landscape) {}
```

<!-- prettier-ignore -->
```css
@media (-webkit-min-device-pixel-ratio: 2) {}
```

## Optional secondary options

### `ignoreMediaFeatureNames: ["/regex/", /regex/, "string"]`

Given:

```
["/^my-/", "custom"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
@media screen and (my-media-feature-name) {}
```

<!-- prettier-ignore -->
```css
@media screen and (custom: 10px) {}
```

<!-- prettier-ignore -->
```css
@media screen and (100px < custom < 700px) {}
```

<!-- prettier-ignore -->
```css
@media (min-width: 700px) and (custom: 10px) {}
```
