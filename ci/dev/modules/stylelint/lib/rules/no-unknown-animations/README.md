# no-unknown-animations

Disallow unknown animations.

<!-- prettier-ignore -->
```css
a { animation-name: fancy-slide; }
/**                    ↑
 *   This animation name */

a { animation: fancy-slide 2s linear; }
/**                    ↑
 *           And this one */
```

This rule considers the identifiers of `@keyframes` rules defined within the same source to be known.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { animation-name: fancy-slide; }
```

<!-- prettier-ignore -->
```css
a { animation: fancy-slide 2s linear; }
```

<!-- prettier-ignore -->
```css
a { animation-name: fancccy-slide; }
@keyframes fancy-slide {}
```

<!-- prettier-ignore -->
```css
a { animation: linear 100ms fancccy-slide; }
@keyframes fancy-slide {}
```

<!-- prettier-ignore -->
```css
a { animation-name: jump; }
@keyframes fancy-slide {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { animation-name: fancy-slide; }
@keyframes fancy-slide {}
```

<!-- prettier-ignore -->
```css
@keyframes fancy-slide {}
a { animation-name: fancy-slide; }
```

<!-- prettier-ignore -->
```css
@keyframes fancy-slide {}
a { animation: fancy-slide 2s linear; }
```

<!-- prettier-ignore -->
```css
a { animation: 100ms steps(12, end) fancy-slide; }
@keyframes fancy-slide {}
```
