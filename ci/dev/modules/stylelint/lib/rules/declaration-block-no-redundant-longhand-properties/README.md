# declaration-block-no-redundant-longhand-properties

Disallow longhand properties that can be combined into one shorthand property.

<!-- prettier-ignore -->
```css
  a {
    padding-top: 1px;
    padding-right: 2px;
    padding-bottom: 3px;
    padding-left: 4px; }
/** ↑
 *  These longhand properties */
```

The longhand properties in the example above can be more concisely written as:

<!-- prettier-ignore -->
```css
a {
  padding: 1px 2px 3px 4px;
}
```

This rule will only complain if you've used the longhand equivalent of _all_ the properties that the shorthand will set.

This rule complains when the following shorthand properties can be used:

- `margin`
- `padding`
- `background`
- `font`
- `border`
- `border-top`
- `border-bottom`
- `border-left`
- `border-right`
- `border-width`
- `border-style`
- `border-color`
- `list-style`
- `border-radius`
- `transition`
- `animation`
- `border-block-end`
- `border-block-start`
- `border-image`
- `border-inline-end`
- `border-inline-start`
- `column-rule`
- `columns`
- `flex`
- `flex-flow`
- `grid`
- `grid-area`
- `grid-column`
- `grid-gap`
- `grid-row`
- `grid-template`
- `outline`
- `text-decoration`
- `text-emphasis`
- `mask`

**Please note** that properties are considered to be redundant if they may be written shorthand according to the specification, **regardless of the behavior of any individual browser**. For example, due to Internet Explorer's implementation of Flexbox, [it may not be possible to use the shorthand property `flex`](https://github.com/philipwalton/flexbugs#flexbug-8), but the longhand form is still considered a violation.

Flexbox-related properties can be ignored using `ignoreShorthands: ["/flex/"]` (see below).

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a {
  margin-top: 1px;
  margin-right: 2px;
  margin-bottom: 3px;
  margin-left: 4px;
}
```

<!-- prettier-ignore -->
```css
a {
  font-style: italic;
  font-variant: normal;
  font-weight: bold;
  font-stretch: normal;
  font-size: 14px;
  line-height: 1.2;
  font-family: serif;
}
```

<!-- prettier-ignore -->
```css
a {
  -webkit-transition-property: top;
  -webkit-transition-duration: 2s;
  -webkit-transition-timing-function: ease;
  -webkit-transition-delay: 0.5s;
}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  margin: 1px 2px 3px 4px;
}
```

<!-- prettier-ignore -->
```css
a {
  font: italic normal bold normal 14px/1.2 serif;
}
```

<!-- prettier-ignore -->
```css
a {
  -webkit-transition: top 2s ease 0.5s;
}
```

<!-- prettier-ignore -->
```css
a {
  margin-top: 1px;
  margin-right: 2px;
}
```

<!-- prettier-ignore -->
```css
a {
  margin-top: 1px;
  margin-right: 2px;
  margin-bottom: 3px;
}
```

## Optional secondary options

### `ignoreShorthands: ["/regex/", /regex/, "string"]`

Given:

```
["padding", "/border/"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {
  padding-top: 20px;
  padding-right: 10px;
  padding-bottom: 30px;
  padding-left: 10px;
}
```

<!-- prettier-ignore -->
```css
a {
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-left-width: 1px;
  border-right-width: 1px;
}
```

<!-- prettier-ignore -->
```css
a {
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-left-width: 1px;
  border-right-width: 1px;
}
```

<!-- prettier-ignore -->
```css
a {
  border-top-color: green;
  border-top-style: double;
  border-top-width: 7px;
}
```
