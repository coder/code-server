# selector-max-pseudo-class

Limit the number of pseudo-classes in a selector.

<!-- prettier-ignore -->
```css
.foo .bar:first-child:hover {}
/*       ↑           ↑
         ↑           ↑
         1           2 -- this selector contains two pseudo-classes */
```

This rule resolves nested selectors before counting the number of pseudo-classes in a selector. Each selector in a [selector list](https://www.w3.org/TR/selectors4/#selector-list) is evaluated separately.

The content of the `:not()` pseudo-class is also evaluated separately. The rule processes the argument as if it were an independent selector, and the result does not count toward the total for the entire selector.

## Options

`int`: Maximum pseudo-classes allowed.

For example, with `1`:

The following patterns are considered violations:

<!-- prettier-ignore -->
```css
a:first-child:focus {}
```

<!-- prettier-ignore -->
```css
.foo .bar:first-child:hover {}
```

The following patterns are _not_ considered violations:

<!-- prettier-ignore -->
```css
a {}
```

<!-- prettier-ignore -->
```css
a:first-child {}
```

<!-- prettier-ignore -->
```css
.foo .bar:first-child {}
```
