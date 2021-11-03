# time-min-milliseconds

Specify the minimum number of milliseconds for time values.

<!-- prettier-ignore -->
```css
a { animation: slip-n-slide 150ms linear; }
/**                         ↑
 *                  This time */
```

This rule checks positive numbers in `transition-duration`, `transition-delay`, `animation-duration`, `animation-delay`, and those times as they manifest in the `transition` and `animation` shorthands.

## Options

`int`: Minimum number of milliseconds for time values.

For example, with `100`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a { animation: 80ms; }
```

<!-- prettier-ignore -->
```css
a { transition-duration: 0.08s; }
```

<!-- prettier-ignore -->
```css
a { transition: background-color 6ms linear; }
```

<!-- prettier-ignore -->
```css
a { animation-delay: 0.01s; }
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a { animation: 8s; }
```

<!-- prettier-ignore -->
```css
a { transition-duration: 0.8s; }
```

<!-- prettier-ignore -->
```css
a { transition: background-color 600ms linear; }
```

<!-- prettier-ignore -->
```css
a { animation-delay: 1s; }
```

## Optional secondary options

### `ignore: ["delay"]`

Ignore time values for an animation or transition delay.

For example, with a minimum of `200` milliseconds.

The following is _not_ considered a violation:

<!-- prettier-ignore -->
```css
a { animation-delay: 100ms; }
```
