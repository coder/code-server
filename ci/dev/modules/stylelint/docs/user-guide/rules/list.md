# List of rules

Grouped first by the following categories and then by the [_thing_](http://apps.workflower.fi/vocabs/css/en) they apply to.

- [Possible errors](#possible-errors)
- [Limit language features](#limit-language-features)
- [Stylistic issues](#stylistic-issues)

## Possible errors

### Color

- [`color-no-invalid-hex`](../../../lib/rules/color-no-invalid-hex/README.md): Disallow invalid hex colors.

### Font family

- [`font-family-no-duplicate-names`](../../../lib/rules/font-family-no-duplicate-names/README.md): Disallow duplicate font family names.
- [`font-family-no-missing-generic-family-keyword`](../../../lib/rules/font-family-no-missing-generic-family-keyword/README.md): Disallow missing generic families in lists of font family names.

### Named grid areas

- [`named-grid-areas-no-invalid`](../../../lib/rules/named-grid-areas-no-invalid/README.md): Disallow invalid named grid areas.

### Function

- [`function-calc-no-invalid`](../../../lib/rules/function-calc-no-invalid/README.md): Disallow an invalid expression within `calc` functions.
- [`function-calc-no-unspaced-operator`](../../../lib/rules/function-calc-no-unspaced-operator/README.md): Disallow an unspaced operator within `calc` functions.
- [`function-linear-gradient-no-nonstandard-direction`](../../../lib/rules/function-linear-gradient-no-nonstandard-direction/README.md): Disallow direction values in `linear-gradient()` calls that are not valid according to the [standard syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient#Syntax).

### String

- [`string-no-newline`](../../../lib/rules/string-no-newline/README.md): Disallow (unescaped) newlines in strings.

### Unit

- [`unit-no-unknown`](../../../lib/rules/unit-no-unknown/README.md): Disallow unknown units.

### Property

- [`property-no-unknown`](../../../lib/rules/property-no-unknown/README.md): Disallow unknown properties.

### Keyframe declaration

- [`keyframe-declaration-no-important`](../../../lib/rules/keyframe-declaration-no-important/README.md): Disallow `!important` within keyframe declarations.

### Declaration block

- [`declaration-block-no-duplicate-custom-properties`](../../../lib/rules/declaration-block-no-duplicate-custom-properties/README.md): Disallow duplicate custom properties within declaration blocks.
- [`declaration-block-no-duplicate-properties`](../../../lib/rules/declaration-block-no-duplicate-properties/README.md): Disallow duplicate properties within declaration blocks.
- [`declaration-block-no-shorthand-property-overrides`](../../../lib/rules/declaration-block-no-shorthand-property-overrides/README.md): Disallow shorthand properties that override related longhand properties.

### Block

- [`block-no-empty`](../../../lib/rules/block-no-empty/README.md): Disallow empty blocks.

### Selector

- [`selector-pseudo-class-no-unknown`](../../../lib/rules/selector-pseudo-class-no-unknown/README.md): Disallow unknown pseudo-class selectors.
- [`selector-pseudo-element-no-unknown`](../../../lib/rules/selector-pseudo-element-no-unknown/README.md): Disallow unknown pseudo-element selectors.
- [`selector-type-no-unknown`](../../../lib/rules/selector-type-no-unknown/README.md): Disallow unknown type selectors.

### Media feature

- [`media-feature-name-no-unknown`](../../../lib/rules/media-feature-name-no-unknown/README.md): Disallow unknown media feature names.

### At-rule

- [`at-rule-no-unknown`](../../../lib/rules/at-rule-no-unknown/README.md): Disallow unknown at-rules.

### Comment

- [`comment-no-empty`](../../../lib/rules/comment-no-empty/README.md): Disallow empty comments.

### General / Sheet

- [`no-descending-specificity`](../../../lib/rules/no-descending-specificity/README.md): Disallow selectors of lower specificity from coming after overriding selectors of higher specificity.
- [`no-duplicate-at-import-rules`](../../../lib/rules/no-duplicate-at-import-rules/README.md): Disallow duplicate `@import` rules within a stylesheet.
- [`no-duplicate-selectors`](../../../lib/rules/no-duplicate-selectors/README.md): Disallow duplicate selectors within a stylesheet.
- [`no-empty-source`](../../../lib/rules/no-empty-source/README.md): Disallow empty sources.
- [`no-extra-semicolons`](../../../lib/rules/no-extra-semicolons/README.md): Disallow extra semicolons (Autofixable).
- [`no-invalid-double-slash-comments`](../../../lib/rules/no-invalid-double-slash-comments/README.md): Disallow double-slash comments (`//...`) which are not supported by CSS.
- [`no-invalid-position-at-import-rule`](../../../lib/rules/no-invalid-position-at-import-rule/README.md): Disallow invalid position `@import` rules within a stylesheet.

## Limit language features

### Alpha-value

- [`alpha-value-notation`](../../../lib/rules/alpha-value-notation/README.md): Specify percentage or number notation for alpha-values (Autofixable).

### Hue

- [`hue-degree-notation`](../../../lib/rules/hue-degree-notation/README.md): Specify number or angle notation for degree hues (Autofixable).

### Color

- [`color-function-notation`](../../../lib/rules/color-function-notation/README.md): Specify modern or legacy notation for applicable color-functions (Autofixable).
- [`color-named`](../../../lib/rules/color-named/README.md): Require (where possible) or disallow named colors.
- [`color-no-hex`](../../../lib/rules/color-no-hex/README.md): Disallow hex colors.

### Length

- [`length-zero-no-unit`](../../../lib/rules/length-zero-no-unit/README.md): Disallow units for zero lengths (Autofixable).

### Font weight

- [`font-weight-notation`](../../../lib/rules/font-weight-notation/README.md): Require numeric or named (where possible) `font-weight` values. Also, when named values are expected, require only valid names.

### Function

- [`function-allowed-list`](../../../lib/rules/function-allowed-list/README.md): Specify a list of allowed functions.
- [`function-blacklist`](../../../lib/rules/function-blacklist/README.md): Specify a list of disallowed functions. **(deprecated)**
- [`function-disallowed-list`](../../../lib/rules/function-disallowed-list/README.md): Specify a list of disallowed functions.
- [`function-url-no-scheme-relative`](../../../lib/rules/function-url-no-scheme-relative/README.md): Disallow scheme-relative urls.
- [`function-url-scheme-allowed-list`](../../../lib/rules/function-url-scheme-allowed-list/README.md): Specify a list of allowed URL schemes.
- [`function-url-scheme-blacklist`](../../../lib/rules/function-url-scheme-blacklist/README.md): Specify a list of disallowed URL schemes. **(deprecated)**
- [`function-url-scheme-disallowed-list`](../../../lib/rules/function-url-scheme-disallowed-list/README.md): Specify a list of disallowed URL schemes.
- [`function-url-scheme-whitelist`](../../../lib/rules/function-url-scheme-whitelist/README.md): Specify a list of allowed URL schemes. **(deprecated)**
- [`function-whitelist`](../../../lib/rules/function-whitelist/README.md): Specify a list of allowed functions. **(deprecated)**

### Keyframes

- [`keyframes-name-pattern`](../../../lib/rules/keyframes-name-pattern/README.md): Specify a pattern for keyframe names.

### Number

- [`number-max-precision`](../../../lib/rules/number-max-precision/README.md): Limit the number of decimal places allowed in numbers.

### Time

- [`time-min-milliseconds`](../../../lib/rules/time-min-milliseconds/README.md): Specify the minimum number of milliseconds for time values.

### Unit

- [`unit-allowed-list`](../../../lib/rules/unit-allowed-list/README.md): Specify a list of allowed units.
- [`unit-blacklist`](../../../lib/rules/unit-blacklist/README.md): Specify a list of disallowed units. **(deprecated)**
- [`unit-disallowed-list`](../../../lib/rules/unit-disallowed-list/README.md): Specify a list of disallowed units.
- [`unit-whitelist`](../../../lib/rules/unit-whitelist/README.md): Specify a list of allowed units. **(deprecated)**

### Shorthand property

- [`shorthand-property-no-redundant-values`](../../../lib/rules/shorthand-property-no-redundant-values/README.md): Disallow redundant values in shorthand properties (Autofixable).

### Value

- [`value-no-vendor-prefix`](../../../lib/rules/value-no-vendor-prefix/README.md): Disallow vendor prefixes for values (Autofixable).

### Custom property

- [`custom-property-pattern`](../../../lib/rules/custom-property-pattern/README.md): Specify a pattern for custom properties.

### Property

- [`property-allowed-list`](../../../lib/rules/property-allowed-list/README.md): Specify a list of allowed properties.
- [`property-blacklist`](../../../lib/rules/property-blacklist/README.md): Specify a list of disallowed properties. **(deprecated)**
- [`property-disallowed-list`](../../../lib/rules/property-disallowed-list/README.md): Specify a list of disallowed properties.
- [`property-no-vendor-prefix`](../../../lib/rules/property-no-vendor-prefix/README.md): Disallow vendor prefixes for properties (Autofixable).
- [`property-whitelist`](../../../lib/rules/property-whitelist/README.md): Specify a list of allowed properties. **(deprecated)**

### Declaration

- [`declaration-block-no-redundant-longhand-properties`](../../../lib/rules/declaration-block-no-redundant-longhand-properties/README.md): Disallow longhand properties that can be combined into one shorthand property.
- [`declaration-no-important`](../../../lib/rules/declaration-no-important/README.md): Disallow `!important` within declarations.
- [`declaration-property-unit-allowed-list`](../../../lib/rules/declaration-property-unit-allowed-list/README.md): Specify a list of allowed property and unit pairs within declarations.
- [`declaration-property-unit-blacklist`](../../../lib/rules/declaration-property-unit-blacklist/README.md): Specify a list of disallowed property and unit pairs within declarations. **(deprecated)**
- [`declaration-property-unit-disallowed-list`](../../../lib/rules/declaration-property-unit-disallowed-list/README.md): Specify a list of disallowed property and unit pairs within declarations.
- [`declaration-property-unit-whitelist`](../../../lib/rules/declaration-property-unit-whitelist/README.md): Specify a list of allowed property and unit pairs within declarations. **(deprecated)**
- [`declaration-property-value-allowed-list`](../../../lib/rules/declaration-property-value-allowed-list/README.md): Specify a list of allowed property and value pairs within declarations.
- [`declaration-property-value-blacklist`](../../../lib/rules/declaration-property-value-blacklist/README.md): Specify a list of disallowed property and value pairs within declarations. **(deprecated)**
- [`declaration-property-value-disallowed-list`](../../../lib/rules/declaration-property-value-disallowed-list/README.md): Specify a list of disallowed property and value pairs within declarations.
- [`declaration-property-value-whitelist`](../../../lib/rules/declaration-property-value-whitelist/README.md): Specify a list of allowed property and value pairs within declarations. **(deprecated)**

### Declaration block

- [`declaration-block-single-line-max-declarations`](../../../lib/rules/declaration-block-single-line-max-declarations/README.md): Limit the number of declarations within a single-line declaration block.

### Selector

- [`selector-attribute-name-disallowed-list`](../../../lib/rules/selector-attribute-name-disallowed-list/README.md): Specify a list of disallowed attribute names.
- [`selector-attribute-operator-allowed-list`](../../../lib/rules/selector-attribute-operator-allowed-list/README.md): Specify a list of allowed attribute operators.
- [`selector-attribute-operator-blacklist`](../../../lib/rules/selector-attribute-operator-blacklist/README.md): Specify a list of disallowed attribute operators. **(deprecated)**
- [`selector-attribute-operator-disallowed-list`](../../../lib/rules/selector-attribute-operator-disallowed-list/README.md): Specify a list of disallowed attribute operators.
- [`selector-attribute-operator-whitelist`](../../../lib/rules/selector-attribute-operator-whitelist/README.md): Specify a list of allowed attribute operators. **(deprecated)**
- [`selector-class-pattern`](../../../lib/rules/selector-class-pattern/README.md): Specify a pattern for class selectors.
- [`selector-combinator-allowed-list`](../../../lib/rules/selector-combinator-allowed-list/README.md): Specify a list of allowed combinators.
- [`selector-combinator-blacklist`](../../../lib/rules/selector-combinator-blacklist/README.md): Specify a list of disallowed combinators. **(deprecated)**
- [`selector-combinator-disallowed-list`](../../../lib/rules/selector-combinator-disallowed-list/README.md): Specify a list of disallowed combinators.
- [`selector-combinator-whitelist`](../../../lib/rules/selector-combinator-whitelist/README.md): Specify a list of allowed combinators. **(deprecated)**
- [`selector-disallowed-list`](../../../lib/rules/selector-disallowed-list/README.md): Specify a list of disallowed selectors.
- [`selector-id-pattern`](../../../lib/rules/selector-id-pattern/README.md): Specify a pattern for ID selectors.
- [`selector-max-attribute`](../../../lib/rules/selector-max-attribute/README.md): Limit the number of attribute selectors in a selector.
- [`selector-max-class`](../../../lib/rules/selector-max-class/README.md): Limit the number of classes in a selector.
- [`selector-max-combinators`](../../../lib/rules/selector-max-combinators/README.md): Limit the number of combinators in a selector.
- [`selector-max-compound-selectors`](../../../lib/rules/selector-max-compound-selectors/README.md): Limit the number of compound selectors in a selector.
- [`selector-max-empty-lines`](../../../lib/rules/selector-max-empty-lines/README.md): Limit the number of adjacent empty lines within selectors (Autofixable).
- [`selector-max-id`](../../../lib/rules/selector-max-id/README.md): Limit the number of ID selectors in a selector.
- [`selector-max-pseudo-class`](../../../lib/rules/selector-max-pseudo-class/README.md): Limit the number of pseudo-classes in a selector.
- [`selector-max-specificity`](../../../lib/rules/selector-max-specificity/README.md): Limit the specificity of selectors.
- [`selector-max-type`](../../../lib/rules/selector-max-type/README.md): Limit the number of type in a selector.
- [`selector-max-universal`](../../../lib/rules/selector-max-universal/README.md): Limit the number of universal selectors in a selector.
- [`selector-nested-pattern`](../../../lib/rules/selector-nested-pattern/README.md): Specify a pattern for the selectors of rules nested within rules.
- [`selector-no-qualifying-type`](../../../lib/rules/selector-no-qualifying-type/README.md): Disallow qualifying a selector by type.
- [`selector-no-vendor-prefix`](../../../lib/rules/selector-no-vendor-prefix/README.md): Disallow vendor prefixes for selectors (Autofixable).
- [`selector-pseudo-class-allowed-list`](../../../lib/rules/selector-pseudo-class-allowed-list/README.md): Specify a list of allowed pseudo-class selectors.
- [`selector-pseudo-class-blacklist`](../../../lib/rules/selector-pseudo-class-blacklist/README.md): Specify a list of disallowed pseudo-class selectors. **(deprecated)**
- [`selector-pseudo-class-disallowed-list`](../../../lib/rules/selector-pseudo-class-disallowed-list/README.md): Specify a list of disallowed pseudo-class selectors.
- [`selector-pseudo-class-whitelist`](../../../lib/rules/selector-pseudo-class-whitelist/README.md): Specify a list of allowed pseudo-class selectors. **(deprecated)**
- [`selector-pseudo-element-allowed-list`](../../../lib/rules/selector-pseudo-element-allowed-list/README.md): Specify a list of allowed pseudo-element selectors.
- [`selector-pseudo-element-blacklist`](../../../lib/rules/selector-pseudo-element-blacklist/README.md): Specify a list of disallowed pseudo-element selectors. **(deprecated)**
- [`selector-pseudo-element-colon-notation`](../../../lib/rules/selector-pseudo-element-colon-notation/README.md): Specify single or double colon notation for applicable pseudo-elements (Autofixable).
- [`selector-pseudo-element-disallowed-list`](../../../lib/rules/selector-pseudo-element-disallowed-list/README.md): Specify a list of disallowed pseudo-element selectors.
- [`selector-pseudo-element-whitelist`](../../../lib/rules/selector-pseudo-element-whitelist/README.md): Specify a list of allowed pseudo-element selectors. **(deprecated)**

### Media feature

- [`media-feature-name-allowed-list`](../../../lib/rules/media-feature-name-allowed-list/README.md): Specify a list of allowed media feature names.
- [`media-feature-name-blacklist`](../../../lib/rules/media-feature-name-blacklist/README.md): Specify a list of disallowed media feature names. **(deprecated)**
- [`media-feature-name-disallowed-list`](../../../lib/rules/media-feature-name-disallowed-list/README.md): Specify a list of disallowed media feature names.
- [`media-feature-name-no-vendor-prefix`](../../../lib/rules/media-feature-name-no-vendor-prefix/README.md): Disallow vendor prefixes for media feature names (Autofixable).
- [`media-feature-name-value-allowed-list`](../../../lib/rules/media-feature-name-value-allowed-list/README.md): Specify a list of allowed media feature name and value pairs.
- [`media-feature-name-value-whitelist`](../../../lib/rules/media-feature-name-value-whitelist/README.md): Specify a list of allowed media feature name and value pairs. **(deprecated)**
- [`media-feature-name-whitelist`](../../../lib/rules/media-feature-name-whitelist/README.md): Specify a list of allowed media feature names. **(deprecated)**

### Custom media

- [`custom-media-pattern`](../../../lib/rules/custom-media-pattern/README.md): Specify a pattern for custom media query names.

### At-rule

- [`at-rule-allowed-list`](../../../lib/rules/at-rule-allowed-list/README.md): Specify a list of allowed at-rules.
- [`at-rule-blacklist`](../../../lib/rules/at-rule-blacklist/README.md): Specify a list of disallowed at-rules. **(deprecated)**
- [`at-rule-disallowed-list`](../../../lib/rules/at-rule-disallowed-list/README.md): Specify a list of disallowed at-rules.
- [`at-rule-no-vendor-prefix`](../../../lib/rules/at-rule-no-vendor-prefix/README.md): Disallow vendor prefixes for at-rules (Autofixable).
- [`at-rule-property-required-list`](../../../lib/rules/at-rule-property-required-list/README.md): Specify a list of required properties for an at-rule.
- [`at-rule-property-requirelist`](../../../lib/rules/at-rule-property-requirelist/README.md): Specify a list of required properties for an at-rule. **(deprecated)**
- [`at-rule-whitelist`](../../../lib/rules/at-rule-whitelist/README.md): Specify a list of allowed at-rules. **(deprecated)**

### Comment

- [`comment-pattern`](../../../lib/rules/comment-pattern/README.md): Specify a pattern for comments.
- [`comment-word-blacklist`](../../../lib/rules/comment-word-blacklist/README.md): Specify a list of disallowed words within comments. **(deprecated)**
- [`comment-word-disallowed-list`](../../../lib/rules/comment-word-disallowed-list/README.md): Specify a list of disallowed words within comments.

### General / Sheet

- [`max-nesting-depth`](../../../lib/rules/max-nesting-depth/README.md): Limit the depth of nesting.
- [`no-unknown-animations`](../../../lib/rules/no-unknown-animations/README.md): Disallow unknown animations.

## Stylistic issues

### Color

- [`color-hex-case`](../../../lib/rules/color-hex-case/README.md): Specify lowercase or uppercase for hex colors (Autofixable).
- [`color-hex-length`](../../../lib/rules/color-hex-length/README.md): Specify short or long notation for hex colors (Autofixable).

### Font family

- [`font-family-name-quotes`](../../../lib/rules/font-family-name-quotes/README.md): Specify whether or not quotation marks should be used around font family names.

### Function

- [`function-comma-newline-after`](../../../lib/rules/function-comma-newline-after/README.md): Require a newline or disallow whitespace after the commas of functions (Autofixable).
- [`function-comma-newline-before`](../../../lib/rules/function-comma-newline-before/README.md): Require a newline or disallow whitespace before the commas of functions (Autofixable).
- [`function-comma-space-after`](../../../lib/rules/function-comma-space-after/README.md): Require a single space or disallow whitespace after the commas of functions (Autofixable).
- [`function-comma-space-before`](../../../lib/rules/function-comma-space-before/README.md): Require a single space or disallow whitespace before the commas of functions (Autofixable).
- [`function-max-empty-lines`](../../../lib/rules/function-max-empty-lines/README.md): Limit the number of adjacent empty lines within functions (Autofixable).
- [`function-name-case`](../../../lib/rules/function-name-case/README.md): Specify lowercase or uppercase for function names (Autofixable).
- [`function-parentheses-newline-inside`](../../../lib/rules/function-parentheses-newline-inside/README.md): Require a newline or disallow whitespace on the inside of the parentheses of functions (Autofixable).
- [`function-parentheses-space-inside`](../../../lib/rules/function-parentheses-space-inside/README.md): Require a single space or disallow whitespace on the inside of the parentheses of functions (Autofixable).
- [`function-url-quotes`](../../../lib/rules/function-url-quotes/README.md): Require or disallow quotes for urls.
- [`function-whitespace-after`](../../../lib/rules/function-whitespace-after/README.md): Require or disallow whitespace after functions (Autofixable).

### Number

- [`number-leading-zero`](../../../lib/rules/number-leading-zero/README.md): Require or disallow a leading zero for fractional numbers less than 1 (Autofixable).
- [`number-no-trailing-zeros`](../../../lib/rules/number-no-trailing-zeros/README.md): Disallow trailing zeros in numbers (Autofixable).

### String

- [`string-quotes`](../../../lib/rules/string-quotes/README.md): Specify single or double quotes around strings (Autofixable).

### Unit

- [`unit-case`](../../../lib/rules/unit-case/README.md): Specify lowercase or uppercase for units (Autofixable).

### Value

- [`value-keyword-case`](../../../lib/rules/value-keyword-case/README.md): Specify lowercase or uppercase for keywords values (Autofixable).

### Value list

- [`value-list-comma-newline-after`](../../../lib/rules/value-list-comma-newline-after/README.md): Require a newline or disallow whitespace after the commas of value lists (Autofixable).
- [`value-list-comma-newline-before`](../../../lib/rules/value-list-comma-newline-before/README.md): Require a newline or disallow whitespace before the commas of value lists.
- [`value-list-comma-space-after`](../../../lib/rules/value-list-comma-space-after/README.md): Require a single space or disallow whitespace after the commas of value lists (Autofixable).
- [`value-list-comma-space-before`](../../../lib/rules/value-list-comma-space-before/README.md): Require a single space or disallow whitespace before the commas of value lists (Autofixable).
- [`value-list-max-empty-lines`](../../../lib/rules/value-list-max-empty-lines/README.md): Limit the number of adjacent empty lines within value lists (Autofixable).

### Custom property

- [`custom-property-empty-line-before`](../../../lib/rules/custom-property-empty-line-before/README.md): Require or disallow an empty line before custom properties (Autofixable).

### Property

- [`property-case`](../../../lib/rules/property-case/README.md): Specify lowercase or uppercase for properties (Autofixable).

### Declaration

- [`declaration-bang-space-after`](../../../lib/rules/declaration-bang-space-after/README.md): Require a single space or disallow whitespace after the bang of declarations (Autofixable).
- [`declaration-bang-space-before`](../../../lib/rules/declaration-bang-space-before/README.md): Require a single space or disallow whitespace before the bang of declarations (Autofixable).
- [`declaration-colon-newline-after`](../../../lib/rules/declaration-colon-newline-after/README.md): Require a newline or disallow whitespace after the colon of declarations (Autofixable).
- [`declaration-colon-space-after`](../../../lib/rules/declaration-colon-space-after/README.md): Require a single space or disallow whitespace after the colon of declarations (Autofixable).
- [`declaration-colon-space-before`](../../../lib/rules/declaration-colon-space-before/README.md): Require a single space or disallow whitespace before the colon of declarations (Autofixable).
- [`declaration-empty-line-before`](../../../lib/rules/declaration-empty-line-before/README.md): Require or disallow an empty line before declarations (Autofixable).

### Declaration block

- [`declaration-block-semicolon-newline-after`](../../../lib/rules/declaration-block-semicolon-newline-after/README.md): Require a newline or disallow whitespace after the semicolons of declaration blocks (Autofixable).
- [`declaration-block-semicolon-newline-before`](../../../lib/rules/declaration-block-semicolon-newline-before/README.md): Require a newline or disallow whitespace before the semicolons of declaration blocks.
- [`declaration-block-semicolon-space-after`](../../../lib/rules/declaration-block-semicolon-space-after/README.md): Require a single space or disallow whitespace after the semicolons of declaration blocks (Autofixable).
- [`declaration-block-semicolon-space-before`](../../../lib/rules/declaration-block-semicolon-space-before/README.md): Require a single space or disallow whitespace before the semicolons of declaration blocks (Autofixable).
- [`declaration-block-trailing-semicolon`](../../../lib/rules/declaration-block-trailing-semicolon/README.md): Require or disallow a trailing semicolon within declaration blocks (Autofixable).

### Block

- [`block-closing-brace-empty-line-before`](../../../lib/rules/block-closing-brace-empty-line-before/README.md): Require or disallow an empty line before the closing brace of blocks (Autofixable).
- [`block-closing-brace-newline-after`](../../../lib/rules/block-closing-brace-newline-after/README.md): Require a newline or disallow whitespace after the closing brace of blocks (Autofixable).
- [`block-closing-brace-newline-before`](../../../lib/rules/block-closing-brace-newline-before/README.md): Require a newline or disallow whitespace before the closing brace of blocks (Autofixable).
- [`block-closing-brace-space-after`](../../../lib/rules/block-closing-brace-space-after/README.md): Require a single space or disallow whitespace after the closing brace of blocks.
- [`block-closing-brace-space-before`](../../../lib/rules/block-closing-brace-space-before/README.md): Require a single space or disallow whitespace before the closing brace of blocks (Autofixable).
- [`block-opening-brace-newline-after`](../../../lib/rules/block-opening-brace-newline-after/README.md): Require a newline after the opening brace of blocks (Autofixable).
- [`block-opening-brace-newline-before`](../../../lib/rules/block-opening-brace-newline-before/README.md): Require a newline or disallow whitespace before the opening brace of blocks (Autofixable).
- [`block-opening-brace-space-after`](../../../lib/rules/block-opening-brace-space-after/README.md): Require a single space or disallow whitespace after the opening brace of blocks (Autofixable).
- [`block-opening-brace-space-before`](../../../lib/rules/block-opening-brace-space-before/README.md): Require a single space or disallow whitespace before the opening brace of blocks (Autofixable).

### Selector

- [`selector-attribute-brackets-space-inside`](../../../lib/rules/selector-attribute-brackets-space-inside/README.md): Require a single space or disallow whitespace on the inside of the brackets within attribute selectors (Autofixable).
- [`selector-attribute-operator-space-after`](../../../lib/rules/selector-attribute-operator-space-after/README.md): Require a single space or disallow whitespace after operators within attribute selectors (Autofixable).
- [`selector-attribute-operator-space-before`](../../../lib/rules/selector-attribute-operator-space-before/README.md): Require a single space or disallow whitespace before operators within attribute selectors (Autofixable).
- [`selector-attribute-quotes`](../../../lib/rules/selector-attribute-quotes/README.md): Require or disallow quotes for attribute values.
- [`selector-combinator-space-after`](../../../lib/rules/selector-combinator-space-after/README.md): Require a single space or disallow whitespace after the combinators of selectors (Autofixable).
- [`selector-combinator-space-before`](../../../lib/rules/selector-combinator-space-before/README.md): Require a single space or disallow whitespace before the combinators of selectors (Autofixable).
- [`selector-descendant-combinator-no-non-space`](../../../lib/rules/selector-descendant-combinator-no-non-space/README.md): Disallow non-space characters for descendant combinators of selectors (Autofixable).
- [`selector-pseudo-class-case`](../../../lib/rules/selector-pseudo-class-case/README.md): Specify lowercase or uppercase for pseudo-class selectors (Autofixable).
- [`selector-pseudo-class-parentheses-space-inside`](../../../lib/rules/selector-pseudo-class-parentheses-space-inside/README.md): Require a single space or disallow whitespace on the inside of the parentheses within pseudo-class selectors (Autofixable).
- [`selector-pseudo-element-case`](../../../lib/rules/selector-pseudo-element-case/README.md): Specify lowercase or uppercase for pseudo-element selectors (Autofixable).
- [`selector-type-case`](../../../lib/rules/selector-type-case/README.md): Specify lowercase or uppercase for type selectors (Autofixable).

### Selector list

- [`selector-list-comma-newline-after`](../../../lib/rules/selector-list-comma-newline-after/README.md): Require a newline or disallow whitespace after the commas of selector lists (Autofixable).
- [`selector-list-comma-newline-before`](../../../lib/rules/selector-list-comma-newline-before/README.md): Require a newline or disallow whitespace before the commas of selector lists (Autofixable).
- [`selector-list-comma-space-after`](../../../lib/rules/selector-list-comma-space-after/README.md): Require a single space or disallow whitespace after the commas of selector lists (Autofixable).
- [`selector-list-comma-space-before`](../../../lib/rules/selector-list-comma-space-before/README.md): Require a single space or disallow whitespace before the commas of selector lists (Autofixable).

### Rule

- [`rule-empty-line-before`](../../../lib/rules/rule-empty-line-before/README.md): Require or disallow an empty line before rules (Autofixable).

### Media feature

- [`media-feature-colon-space-after`](../../../lib/rules/media-feature-colon-space-after/README.md): Require a single space or disallow whitespace after the colon in media features (Autofixable).
- [`media-feature-colon-space-before`](../../../lib/rules/media-feature-colon-space-before/README.md): Require a single space or disallow whitespace before the colon in media features (Autofixable).
- [`media-feature-name-case`](../../../lib/rules/media-feature-name-case/README.md): Specify lowercase or uppercase for media feature names (Autofixable).
- [`media-feature-parentheses-space-inside`](../../../lib/rules/media-feature-parentheses-space-inside/README.md): Require a single space or disallow whitespace on the inside of the parentheses within media features (Autofixable).
- [`media-feature-range-operator-space-after`](../../../lib/rules/media-feature-range-operator-space-after/README.md): Require a single space or disallow whitespace after the range operator in media features (Autofixable).
- [`media-feature-range-operator-space-before`](../../../lib/rules/media-feature-range-operator-space-before/README.md): Require a single space or disallow whitespace before the range operator in media features (Autofixable).

### Media query list

- [`media-query-list-comma-newline-after`](../../../lib/rules/media-query-list-comma-newline-after/README.md): Require a newline or disallow whitespace after the commas of media query lists (Autofixable).
- [`media-query-list-comma-newline-before`](../../../lib/rules/media-query-list-comma-newline-before/README.md): Require a newline or disallow whitespace before the commas of media query lists.
- [`media-query-list-comma-space-after`](../../../lib/rules/media-query-list-comma-space-after/README.md): Require a single space or disallow whitespace after the commas of media query lists (Autofixable).
- [`media-query-list-comma-space-before`](../../../lib/rules/media-query-list-comma-space-before/README.md): Require a single space or disallow whitespace before the commas of media query lists (Autofixable).

### At-rule

- [`at-rule-empty-line-before`](../../../lib/rules/at-rule-empty-line-before/README.md): Require or disallow an empty line before at-rules (Autofixable).
- [`at-rule-name-case`](../../../lib/rules/at-rule-name-case/README.md): Specify lowercase or uppercase for at-rules names (Autofixable).
- [`at-rule-name-newline-after`](../../../lib/rules/at-rule-name-newline-after/README.md): Require a newline after at-rule names.
- [`at-rule-name-space-after`](../../../lib/rules/at-rule-name-space-after/README.md): Require a single space after at-rule names (Autofixable).
- [`at-rule-semicolon-newline-after`](../../../lib/rules/at-rule-semicolon-newline-after/README.md): Require a newline after the semicolon of at-rules (Autofixable).
- [`at-rule-semicolon-space-before`](../../../lib/rules/at-rule-semicolon-space-before/README.md): Require a single space or disallow whitespace before the semicolons of at-rules.

### Comment

- [`comment-empty-line-before`](../../../lib/rules/comment-empty-line-before/README.md): Require or disallow an empty line before comments (Autofixable).
- [`comment-whitespace-inside`](../../../lib/rules/comment-whitespace-inside/README.md): Require or disallow whitespace on the inside of comment markers (Autofixable).

### General / Sheet

- [`indentation`](../../../lib/rules/indentation/README.md): Specify indentation (Autofixable).
- [`linebreaks`](../../../lib/rules/linebreaks/README.md): Specify unix or windows linebreaks (Autofixable).
- [`max-empty-lines`](../../../lib/rules/max-empty-lines/README.md): Limit the number of adjacent empty lines (Autofixable).
- [`max-line-length`](../../../lib/rules/max-line-length/README.md): Limit the length of a line.
- [`no-eol-whitespace`](../../../lib/rules/no-eol-whitespace/README.md): Disallow end-of-line whitespace (Autofixable).
- [`no-missing-end-of-source-newline`](../../../lib/rules/no-missing-end-of-source-newline/README.md): Disallow missing end-of-source newlines (Autofixable).
- [`no-empty-first-line`](../../../lib/rules/no-empty-first-line/README.md): Disallow empty first lines (Autofixable).
- [`unicode-bom`](../../../lib/rules/unicode-bom/README.md): Require or disallow Unicode BOM.
- [`no-irregular-whitespace`](../../../lib/rules/no-irregular-whitespace/README.md): Disallow irregular whitespace.
