# Combining rules

You can combine rules to enforce strict conventions.

## `*-newline/space-before` and `*-newline/space-after` rules

Say you want to enforce no space before and a single space after the colon in every declaration:

<!-- prettier-ignore -->
```css
a { color: pink; }
/**      ↑
 * No space before and a single space after this colon */
```

You can enforce that with:

```json
{
  "declaration-colon-space-after": "always",
  "declaration-colon-space-before": "never"
}
```

Some _things_ (e.g. declaration blocks and value lists) can span more than one line. In these cases, `newline` rules and extra options can be used to provide flexibility.

For example, this is the complete set of `value-list-comma-*` rules and their options:

- `value-list-comma-space-after`: `"always"|"never"|"always-single-line"|"never-single-line"`
- `value-list-comma-space-before`: `"always"|"never"|"always-single-line"|"never-single-line"`
- `value-list-comma-newline-after`: `"always"|"always-multi-line|"never-multi-line"`
- `value-list-comma-newline-before`: `"always"|"always-multi-line"|"never-multi-line"`

Where `*-multi-line` and `*-single-line` are in reference to the value list (the _thing_). For example, given:

<!-- prettier-ignore -->
```css
a,
b {
  color: red;
  font-family: sans, serif, monospace; /* single-line value list */
}              ↑                    ↑
/**            ↑                    ↑
 *  The value list starts here and ends here */
```

There is only a single-line value list in this example. The selector is multi-line, as is the declaration block and, as such, also the rule. But the value list isn't. The `*-multi-line` and `*-single-line` refer to the value list in the context of this rule.

### Example A

Say you only want to allow single-line value lists. And you want to enforce no space before and a single space after the commas:

<!-- prettier-ignore -->
```css
a {
  font-family: sans, serif, monospace;
  box-shadow: 1px 1px 1px red, 2px 2px 1px 1px blue inset, 2px 2px 1px 2px blue inset;
}
```

You can enforce that with:

```json
{
  "value-list-comma-space-after": "always",
  "value-list-comma-space-before": "never"
}
```

### Example B

Say you want to allow both single-line and multi-line value lists. You want there to be a single space after the commas in the single-line lists and no space before the commas in both the single-line and multi-line lists:

<!-- prettier-ignore -->
```css
a {
  font-family: sans, serif, monospace; /* single-line value list with space after, but no space before */
  box-shadow: 1px 1px 1px red, /* multi-line value list ... */
    2px 2px 1px 1px blue inset, /* ... with newline after, ...  */
    2px 2px 1px 2px blue inset; /* ... but no space before */
}
```

You can enforce that with:

```json
{
  "value-list-comma-newline-after": "always-multi-line",
  "value-list-comma-space-after": "always-single-line",
  "value-list-comma-space-before": "never"
}
```

### Example C

Say you want to allow both single-line and multi-line value lists. You want there to be no space before the commas in the single-line lists and always a space after the commas in both lists:

<!-- prettier-ignore -->
```css
a {
  font-family: sans, serif, monospace;
  box-shadow: 1px 1px 1px red
    , 2px 2px 1px 1px blue inset
    , 2px 2px 1px 2px blue inset;
}
```

You can enforce that with:

```json
{
  "value-list-comma-newline-before": "always-multi-line",
  "value-list-comma-space-after": "always",
  "value-list-comma-space-before": "never-single-line"
}
```

### Example D

The rules are flexible enough to enforce entirely different conventions for single-line and multi-line lists. Say you want to allow both single-line and multi-line value lists. You want the single-line lists to have a single space before and after the colons. Whereas you want the multi-line lists to have a single newline before the commas, but no space after:

<!-- prettier-ignore -->
```css
a {
  font-family: sans , serif , monospace; /* single-line list with a single space before and after the comma */
  box-shadow: 1px 1px 1px red /* multi-line list ... */
    ,2px 2px 1px 1px blue inset /* ... with newline before, ...  */
    ,2px 2px 1px 2px blue inset; /* ... but no space after the comma */
}
```

You can enforce that with:

```json
{
  "value-list-comma-newline-after": "never-multi-line",
  "value-list-comma-newline-before": "always-multi-line",
  "value-list-comma-space-after": "always-single-line",
  "value-list-comma-space-before": "always-single-line"
}
```

### Example E

Say you want to disable single-line blocks:

<!-- prettier-ignore -->
```css
  a { color: red; }
/** ↑
 * Declaration blocks like this */
```

Use the `block-opening-brace-newline-after` and `block-opening-brace-newline-before` rules together. For example, this config:

```json
{
  "block-opening-brace-newline-after": ["always"],
  "block-closing-brace-newline-before": ["always"]
}
```

Would allow:

<!-- prettier-ignore -->
```css
a {
  color: red;
}
```

But not these patterns:

<!-- prettier-ignore -->
```css
a { color: red;
}

a {
color: red; }

a { color: red; }
```

To allow single-line blocks but enforce newlines with multi-line blocks, use the `"always-multi-line"` option for both rules.

## `*-empty-line-before` and `*-max-empty-lines` rules

These rules work together to control where empty lines are allowed.

Each _thing_ is responsible for pushing itself away from the _preceding thing_, rather than pushing the _subsequent thing_ away. This consistency is to avoid conflicts and is why there aren't any `*-empty-line-after` rules in stylelint.

Say you want to enforce the following:

<!-- prettier-ignore -->
```css
a {
  background: green;
  color: red;

  @media (min-width: 30em) {
    color: blue;
  }
}

b {
  --custom-property: green;

  background: pink;
  color: red;
}
```

You can do that with:

```json
{
  "at-rule-empty-line-before": [
    "always",
    {
      "except": ["first-nested"]
    }
  ],
  "custom-property-empty-line-before": [
    "always",
    {
      "except": ["after-custom-property", "first-nested"]
    }
  ],
  "declaration-empty-line-before": [
    "always",
    {
      "except": ["after-declaration", "first-nested"]
    }
  ],
  "block-closing-brace-empty-line-before": "never",
  "rule-empty-line-before": ["always-multi-line"]
}
```

We recommend that you set your primary option (e.g. `"always"` or `"never"`) to whatever is your most common occurrence and define your exceptions with the `except` optional secondary options. There are many values for the `except` option e.g. `first-nested`, `after-comment` etc.

The `*-empty-line-before` rules control whether there must never be an empty line or whether there must be _one or more_ empty lines before a _thing_. The `*-max-empty-lines` rules complement this by controlling _the number_ of empty lines within _things_. The `max-empty-lines` rule sets a limit across the entire source. A _stricter_ limit can then be set within _things_ using the likes of `function-max-empty-lines`, `selector-max-empty-lines` and `value-list-max-empty-lines`.

For example, say you want to enforce the following:

<!-- prettier-ignore -->
```css
a,
b {
  box-shadow:
    inset 0 2px 0 #dcffa6,
    0 2px 5px #000;
}

c {
  transform:
    translate(
      1,
      1
    );
}
```

i.e. a maximum of 1 empty line within the whole source, but no empty lines within functions, selector lists and value lists.

You can do that with:

```json
{
  "function-max-empty-lines": 0,
  "max-empty-lines": 1,
  "selector-list-max-empty-lines": 0,
  "value-list-max-empty-lines": 0
}
```

## `*-allowed-list`, `*-disallowed-list`, `color-named` and applicable `*-no-*` rules

These rules work together to (dis)allow language features and constructs.

There are `*-allowed-list` and `*-disallowed-list` rules that target the constructs of the CSS language: at-rules, functions, declarations (i.e. property-value pairs), properties and units. These rules (dis)allow any language features that make use of these constructs (e.g. `@media`, `rgb()`). However, there are features not caught by these `*-allowed-list` and `*-disallowed-list` rules (or are, but would require complex regex to configure). There are individual rules, usually a `*-no-*` rule (e.g. `color-no-hex` and `selector-no-id`), to disallow each of these features.

Say you want to disallow the `@debug` language extension. You can do that using either the `at-rule-disallowed-list` or `at-rule-allowed-list` rules because the `@debug` language extension uses the at-rule construct e.g.

```json
{
  "at-rule-disallowed-list": ["debug"]
}
```

Say you want to, for whatever reason, disallow the whole at-rule construct. You can do that using:

```json
{
  "at-rule-allowed-list": []
}
```

Say you want to disallow the value `none` for the `border` properties. You can do that using either the `declaration-property-value-disallowed-list` or `declaration-property-value-allowed-list` e.g.

```json
{
  "declaration-property-value-disallowed-list": [
    {
      "/^border/": ["none"]
    }
  ]
}
```

## `color-*` and `function-*` rules

Most `<color>` values are _functions_. As such, they can be (dis)allowed using either the `function-allowed-list` or `function-disallowed-list` rules. Two other color representations aren't functions: named colors and hex colors. There are two specific rules that (dis)allow these: `color-named` and `color-no-hex`, respectively.

Say you want to enforce using a named color _if one exists for your chosen color_ and use `hwb` color if one does not, e.g.:

<!-- prettier-ignore -->
```css
a {
  background: hwb(235, 0%, 0%); /* there is no named color equivalent for this color */
  color: black;
}
```

If you're taking an allow approach, you can do that with:

```json
{
  "color-named": "always-where-possible",
  "color-no-hex": true,
  "function-allowed-list": ["hwb"]
}
```

Or, if you're taking a disallow approach:

```json
{
  "color-named": "always-where-possible",
  "color-no-hex": true,
  "function-disallowed-list": ["/^rgb/", "/^hsl/", "gray"]
}
```

This approach scales to when language extensions (that use the two built-in extendable syntactic constructs of at-rules and functions) are used. For example, say you want to disallow all standard color presentations in favour of using a custom color representation function, e.g. `my-color(red with a dash of green / 5%)`. You can do that with:

```json
{
  "color-named": "never",
  "color-no-hex": true,
  "function-allowed-list": ["my-color"]
}
```

## Manage conflicts

Each rule stands alone, so sometimes it's possible to configure rules such that they conflict with one another. For example, you could turn on two conflicting allow and disallow list rules, e.g. `unit-allowed-list` and `unit-disallowed-list`.

It's your responsibility as the configuration author to resolve these conflicts.
