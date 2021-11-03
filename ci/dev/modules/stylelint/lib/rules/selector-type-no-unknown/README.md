# selector-type-no-unknown

Disallow unknown type selectors.

<!-- prettier-ignore -->
```css
    unknown {}
/** ↑
 * This type selector */
```

This rule considers tags defined in the HTML, SVG, and MathML specifications to be known.

## Options

### `true`

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
unknown {}
```

<!-- prettier-ignore -->
```css
tag {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
input {}
```

<!-- prettier-ignore -->
```css
ul li {}
```

<!-- prettier-ignore -->
```css
li > a {}
```

## Optional secondary options

### `ignore: ["custom-elements", "default-namespace"]`

#### `"custom-elements"`

Allow custom elements.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
unknown {}
```

<!-- prettier-ignore -->
```css
x-Foo {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
x-foo {}
```

#### `"default-namespace"`

Allow unknown type selectors if they belong to the default namespace.

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
namespace|unknown {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
unknown {}
```

### `ignoreNamespaces: ["/regex/", /regex/, "string"]`

Given:

```
["/^my-/", "custom-namespace"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
custom-namespace|unknown {}
```

<!-- prettier-ignore -->
```css
my-namespace|unknown {}
```

<!-- prettier-ignore -->
```css
my-other-namespace|unknown {}
```

### `ignoreTypes: ["/regex/", /regex/, "string"]`

Given:

```
["/^my-/", "custom-type"]
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
custom-type {}
```

<!-- prettier-ignore -->
```css
my-type {}
```

<!-- prettier-ignore -->
```css
my-other-type {}
```
