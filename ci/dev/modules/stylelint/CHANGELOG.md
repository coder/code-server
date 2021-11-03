# Changelog

All notable changes to this project are documented in this file.

## 13.13.1

- Fixed: invalid JSON for `max-warnings` option ([#5267](https://github.com/stylelint/stylelint/pull/5267)).
- Fixed: `no-invalid-position-at-import-rule` false positives for dollar variables ([#5264](https://github.com/stylelint/stylelint/pull/5264)).

## 13.13.0

- Added: `no-invalid-position-at-import-rule` rule ([#5202](https://github.com/stylelint/stylelint/pull/5202)).
- Added: `no-irregular-whitespace` rule ([#5209](https://github.com/stylelint/stylelint/pull/5209)).
- Added: `selector-disallowed-list` rule ([#5239](https://github.com/stylelint/stylelint/pull/5239)).
- Added: `selector-attribute-quotes` autofix ([#5248](https://github.com/stylelint/stylelint/pull/5248)).
- Added: `ignore: ["inside-function"]` to `declaration-property-unit-allowed-list` ([#5194](https://github.com/stylelint/stylelint/pull/5194)).
- Fixed: `color-no-hex` false positives for CSS-in-JS objection notation ([#5186](https://github.com/stylelint/stylelint/pull/5186)).
- Fixed: `font-family-no-missing-generic-family-keyword` false positives for variables ([#5240](https://github.com/stylelint/stylelint/pull/5240)).
- Fixed: `length-zero-no-unit` autofix removing trailing zeroes ([#5256](https://github.com/stylelint/stylelint/pull/5256)).
- Fixed: `length-zero-no-unit` false positives for level 4 math functions ([#5203](https://github.com/stylelint/stylelint/pull/5203)).
- Fixed: `length-zero-no-unit` false positives for functions inside of math functions ([#5245](https://github.com/stylelint/stylelint/pull/5245)).

## 13.12.0

- Added: `named-grid-areas-no-invalid` rule ([#5167](https://github.com/stylelint/stylelint/pull/5167)).
- Added: `ignore: ["single-declaration"]` to `declaration-block-trailing-semicolon` ([#5165](https://github.com/stylelint/stylelint/pull/5165)).
- Fixed: `*-no-unknown` false positives ([#5158](https://github.com/stylelint/stylelint/pull/5158)).
- Fixed: `selector-pseudo-class-no-unknown` false positives for `:autofill` ([#5171](https://github.com/stylelint/stylelint/pull/5171)).

## 13.11.0

- Added: exceptions and severity options to `report*` configuration object properties ([#5143](https://github.com/stylelint/stylelint/pull/5143)).

## 13.10.0

- Added: `ignoreDisables`, `reportNeedlessDisables`, `reportInvalidScopeDisables` and `reportDescriptionlessDisables` configuration object properties ([#5126](https://github.com/stylelint/stylelint/pull/5126)).
- Added: `declaration-block-no-duplicate-custom-properties` rule ([#5125](https://github.com/stylelint/stylelint/pull/5125)).
- Fixed: `alpha-value-notation` false negatives for CSS Variables ([#5130](https://github.com/stylelint/stylelint/pull/5130)).

## 13.9.0

- Added: TAP formatter ([#5062](https://github.com/stylelint/stylelint/pull/5062)).
- Fixed: incorrect exit code when using `--report` options ([#5079](https://github.com/stylelint/stylelint/pull/5079)).
- Fixed: `color-hex-case` false negatives for css-in-js object notation ([#5101](https://github.com/stylelint/stylelint/pull/5101)).
- Fixed: `color-hex-length` false negatives for css-in-js object notation ([#5106](https://github.com/stylelint/stylelint/pull/5106)).
- Fixed: `selector-attribute-name-disallowed-list` false positives for valueless attribute selectors ([#5060](https://github.com/stylelint/stylelint/pull/5060)).

## 13.8.0

- Deprecated: `StylelintStandaloneReturnValue.reportedDisables`, `.descriptionlessDisables`, `.needlessDisables`, and `.invalidScopeDisables`. `.reportedDisables` will always be empty and the other properties will always be undefined, since these errors now show up in `.results` instead ([#4973](https://github.com/stylelint/stylelint/pull/4973)).
- Added: disable comments that are reported as errors for various reasons are now reported as standard lint errors rather than a separate class of errors that must be handled specially ([#4973](https://github.com/stylelint/stylelint/pull/4973)).
- Added: `comment-pattern` rule ([#4962](https://github.com/stylelint/stylelint/pull/4962)).
- Added: `selector-attribute-name-disallowed-list` rule ([#4992](https://github.com/stylelint/stylelint/pull/4992)).
- Added: `ignoreAtRules[]` to `property-no-unknown` ([#4965](https://github.com/stylelint/stylelint/pull/4965)).
- Fixed: `*-notation` false negatives for dollar variables ([#5031](https://github.com/stylelint/stylelint/pull/5031)).
- Fixed: `*-pattern` missing configured pattern in violation messages ([#4975](https://github.com/stylelint/stylelint/pull/4975)).

## 13.7.2

- Fixed: regression for disable commands and adjacent double-slash comments ([#4950](https://github.com/stylelint/stylelint/pull/4950)).
- Fixed: use of full file path without converting it to glob ([#4931](https://github.com/stylelint/stylelint/pull/4931)).

## 13.7.1

- Fixed: double-slash disable comments when followed by another comment ([#4913](https://github.com/stylelint/stylelint/pull/4913)).

## 13.7.0

- Deprecated: `*-blacklist`, `*-requirelist` and `*-whitelist` rules in favour of the new `*-disallowed-list`, `*-required-list` and `*-allowed-list` ones ([#4845](https://github.com/stylelint/stylelint/pull/4845)):
  - `at-rule-blacklist`. Use `at-rule-disallowed-list` instead.
  - `at-rule-property-requirelist`. Use `at-rule-property-required-list` instead.
  - `at-rule-whitelist`. Use `at-rule-allowed-list` instead.
  - `comment-word-blacklist`. Use `comment-word-disallowed-list` instead.
  - `declaration-property-unit-blacklist`. Use `declaration-property-unit-disallowed-list` instead.
  - `declaration-property-unit-whitelist`. Use `declaration-property-unit-allowed-list` instead.
  - `declaration-property-value-blacklist`. Use `declaration-property-value-disallowed-list` instead.
  - `declaration-property-value-whitelist`. Use `declaration-property-value-allowed-list` instead.
  - `function-blacklist`. Use `function-disallowed-list` instead.
  - `function-url-scheme-blacklist`. Use `function-url-scheme-disallowed-list` instead.
  - `function-url-scheme-whitelist`. Use `function-url-scheme-allowed-list` instead.
  - `function-whitelist`. Use `function-allowed-list` instead.
  - `media-feature-name-blacklist`. Use `media-feature-name-disallowed-list` instead.
  - `media-feature-name-value-whitelist`. Use `media-feature-name-value-allowed-list` instead.
  - `media-feature-name-whitelist`. Use `media-feature-name-allowed-list` instead.
  - `property-blacklist`. Use `property-disallowed-list` instead.
  - `property-whitelist`. Use `property-allowed-list` instead.
  - `selector-attribute-operator-blacklist`. Use `selector-attribute-operator-disallowed-list` instead.
  - `selector-attribute-operator-whitelist`. Use `selector-attribute-operator-allowed-list` instead.
  - `selector-combinator-blacklist`. Use `selector-combinator-disallowed-list` instead.
  - `selector-combinator-whitelist`. Use `selector-combinator-allowed-list` instead.
  - `selector-pseudo-class-blacklist`. Use `selector-pseudo-class-disallowed-list` instead.
  - `selector-pseudo-class-whitelist`. Use `selector-pseudo-class-allowed-list` instead.
  - `selector-pseudo-element-blacklist`. Use `selector-pseudo-element-disallowed-list` instead.
  - `selector-pseudo-element-whitelist`. Use `selector-pseudo-element-allowed-list` instead.
  - `unit-blacklist`. Use `unit-disallowed-list` instead.
  - `unit-whitelist`. Use `unit-allowed-list` instead.
- Added: syntax object acceptance to `customSyntax` option ([#4839](https://github.com/stylelint/stylelint/pull/4839)).
- Added: support for `*.cjs` config files ([#4905](https://github.com/stylelint/stylelint/pull/4905)).
- Added: support for descriptions in stylelint command comments ([#4848](https://github.com/stylelint/stylelint/pull/4848)).
- Added: `reportDescriptionlessDisables` flag ([#4907](https://github.com/stylelint/stylelint/pull/4907)).
- Added: `reportDisables` secondary option ([#4897](https://github.com/stylelint/stylelint/pull/4897)).
- Added: `*-no-vendor-prefix` autofix ([#4859](https://github.com/stylelint/stylelint/pull/4859)).
- Added: `ignoreComments[]` to `comment-empty-line-before` ([#4841](https://github.com/stylelint/stylelint/pull/4841)).
- Added: `ignoreContextFunctionalPseudoClasses` to `selector-max-id` ([#4835](https://github.com/stylelint/stylelint/pull/4835)).
- Fixed: inconsistent trailing newlines in CLI error output ([#4876](https://github.com/stylelint/stylelint/pull/4876)).
- Fixed: support for multi-line disable descriptions ([#4895](https://github.com/stylelint/stylelint/pull/4895)).
- Fixed: support for paths with parentheses ([#4867](https://github.com/stylelint/stylelint/pull/4867)).
- Fixed: `selector-max-*` (except `selector-max-type`) false negatives for `where`, `is`, `nth-child` and `nth-last-child` ([#4842](https://github.com/stylelint/stylelint/pull/4842)).
- Fixed: `length-zero-no-unit` TypeError for custom properties fallback ([#4860](https://github.com/stylelint/stylelint/pull/4860)).
- Fixed: `selector-combinator-space-after` false positives for trailing combinator ([#4878](https://github.com/stylelint/stylelint/pull/4878)).

## 13.6.1

- Fixed: `max-empty-lines` TypeError from inline comment with autofix and sugarss syntax ([#4821](https://github.com/stylelint/stylelint/pull/4821)).
- Fixed: `property-no-unknown` false positives for namespaced variables ([#4803](https://github.com/stylelint/stylelint/pull/4803)).
- Fixed: `selector-type-no-unknown` false positives for idents within `::part` pseudo-elements ([#4828](https://github.com/stylelint/stylelint/pull/4828)).

## 13.6.0

- Added: `ignoreSelectors[]` to `block-opening-brace-space-before` ([#4640](https://github.com/stylelint/stylelint/pull/4640)).
- Fixed: false positives for all scope disables in `--report-invalid-scope-disables` ([#4784](https://github.com/stylelint/stylelint/pull/4784)).
- Fixed: TypeError for CSS-in-JS when encountering a call or template expression named 'html' ([#4797](https://github.com/stylelint/stylelint/pull/4797)).
- Fixed: writing error information to `stderr` ([#4799](https://github.com/stylelint/stylelint/pull/4799)).
- Fixed: minimum node version in `package.json`'s `engine` field ([#4790](https://github.com/stylelint/stylelint/pull/4790)).
- Fixed: `alpha-value-notation` number precision errors ([#4802](https://github.com/stylelint/stylelint/pull/4802)).
- Fixed: `font-family-no-missing-generic-family-keyword` false positives for variables ([#4806](https://github.com/stylelint/stylelint/pull/4806)).
- Fixed: `no-duplicate-selectors` false positives for universal selector and `disallowInList` ([#4809](https://github.com/stylelint/stylelint/pull/4809)).

## 13.5.0

- Added: `alpha-value-notation` rule ([#4770](https://github.com/stylelint/stylelint/pull/4770)).
- Added: `color-function-notation` rule ([#4760](https://github.com/stylelint/stylelint/pull/4760)).
- Added: `hue-degree-notation` rule ([#4769](https://github.com/stylelint/stylelint/pull/4769)).

## 13.4.1

- Fixed: `time-min-milliseconds` TypeError for `ignore: ["delay"]` and shorthand animation ([#4783](https://github.com/stylelint/stylelint/pull/4783)).

## 13.4.0

- Added: `ignore:["delay"]` to `time-min-milliseconds` ([#4743](https://github.com/stylelint/stylelint/pull/4743)).
- Added: `ignoreFunctions: []` to `value-keyword-case` ([#4733](https://github.com/stylelint/stylelint/pull/4733)).
- Fixed: improved performance when auto syntax is used ([#4729](https://github.com/stylelint/stylelint/pull/4729)).
- Fixed: `--report-needless-disables` respects stylelint-disable commands ([#4714](https://github.com/stylelint/stylelint/pull/4714)).
- Fixed: `at-rule-property-requirelist` TypeError for comments inside of font-face ([#4744](https://github.com/stylelint/stylelint/pull/4744)).
- Fixed: `declaration-block-trailing-semicolon` false positives for CSS-in-JS object notation ([#4749](https://github.com/stylelint/stylelint/pull/4749)).
- Fixed: `declaration-empty-line-before` false positives for inlines styles ([#4726](https://github.com/stylelint/stylelint/pull/4726)).
- Fixed: `media-feature-name-*` false positives for `forced-colors` ([#4775](https://github.com/stylelint/stylelint/pull/4775)).
- Fixed: `value-keyword-case` false positives WebExtension replacement keywords ([#4778](https://github.com/stylelint/stylelint/pull/4778)).
- Fixed: `value-keyword-case` false positives regression for mixed-case properties and the `ignoreProperties` option ([#4748](https://github.com/stylelint/stylelint/pull/4748)).

## 13.3.3

- Fixed: autofix will respect scoped disable comments by turning off autofix for the scoped rules for the entire source; this is a continuation of the workaround added in `13.2.0` ([#4705](https://github.com/stylelint/stylelint/pull/4705)).

## 13.3.2

- Fixed: update postcss-css-in-js with fix for maximum call stack size exceeded error ([#4701](https://github.com/stylelint/stylelint/pull/4701)).

## 13.3.1

- Fixed: babel configuration conflict when using TypeScript ([postcss-css-in-js/#2](https://github.com/stylelint/postcss-css-in-js/pull/2)).
- Fixed: autofix for nested tagged template literals ([#4119](https://github.com/stylelint/stylelint/pull/4119)).

## 13.3.0

- Added: `ignoreFontFamilies: []` to `font-family-no-missing-generic-family-keyword` ([#4656](https://github.com/stylelint/stylelint/pull/4656)).
- Fixed: `function-calc-no-invalid` false positives for SCSS and Less variables ([#4659](https://github.com/stylelint/stylelint/pull/4659)).
- Fixed: `unit-no-unknown` false positives for `x` unit within vendor-prefixed `image-set` ([#4654](https://github.com/stylelint/stylelint/pull/4654)).

## 13.2.1

- Fixed: `selector-pseudo-element-no-unknown` false positives for `::part` pseudo-element ([#4604](https://github.com/stylelint/stylelint/pull/4604)).
- Fixed: `value-keyword-case` false positives for longhand `grid-column/row-*` properties ([#4611](https://github.com/stylelint/stylelint/pull/4611)).

## 13.2.0

- Security: updated to `postcss-selector-parser@6` due to a vulnerability in one of `postcss-selector-parser@3` dependencies ([#4595](https://github.com/stylelint/stylelint/pull/4595)). Due to this update:
  - `selector-descendant-combinator-no-non-space` will ignore selectors containing comments
  - `selector-pseudo-class-parentheses-space-inside` can't autofix pseudo-classes that contain comments
- Added: `--stdin` CLI flag that accepts stdin input even if it is empty ([#4594](https://github.com/stylelint/stylelint/pull/4594)).
- Fixed: autofix will ignore sources containing disable comments or nested tagged template literals - this is workaround to make autofix safer to use until we can resolve the [underlying](https://github.com/stylelint/stylelint/issues/4119) [issues](https://github.com/stylelint/stylelint/issues/2643) ([#4573](https://github.com/stylelint/stylelint/pull/4573)).

## 13.1.0

- Fixed: `media-feature-name-*` false negatives for range context ([#4581](https://github.com/stylelint/stylelint/pull/4581)).
- Fixed: `indentation` RangeError regression ([#4572](https://github.com/stylelint/stylelint/pull/4572)).
- Fixed: `string-quotes` attribute selector autofix ([#4576](https://github.com/stylelint/stylelint/pull/4576)).

## 13.0.0

- Removed: Node.js 8.x support. Node.js 10 is now required. We can guarantee stylelint works on the latest Node.js 10 release. ([#4500](https://github.com/stylelint/stylelint/pull/4500)).
- Removed: types declarations for Flow ([#4451](https://github.com/stylelint/stylelint/pull/4451)).
- Changed: `globby` was updated to v10. Now only forward-slashes (`/`) should be used as directory separator in globs. Refer to [glob pattern syntax](https://github.com/mrmlnc/fast-glob#pattern-syntax). Most of the users wouldn't need to change anything, but Windows users might need to update their globs. ([#4254](https://github.com/stylelint/stylelint/pull/4254)).
- Added: `unit-no-unknown` support for `x` unit ([#4427](https://github.com/stylelint/stylelint/pull/4427)).
- Fixed: `--report-invalid-scope-disables` crash when no rules specified ([#4498](https://github.com/stylelint/stylelint/pull/4498)).
- Fixed: `media-feature-parentheses-space-inside` false negatives for multiple spaces ([#4513](https://github.com/stylelint/stylelint/pull/4513)).
- Fixed: `selector-type-no-unknown` false positives for SVG tags ([#4495](https://github.com/stylelint/stylelint/pull/4495)).
- Fixed: `unit-no-unknown` false positives for Sass map keys ([#4450](https://github.com/stylelint/stylelint/pull/4450)).
- Fixed: `value-list-comma-newline-after` false positives for shared-line comments ([#4482](https://github.com/stylelint/stylelint/pull/4482)).
- Fixed: consistently check that selectors are standard before passing to the parser ([#4483](https://github.com/stylelint/stylelint/pull/4483)).
- Fixed: overlapping disabled ranges edge case ([#4497](https://github.com/stylelint/stylelint/pull/4497)).

## 12.0.1

- Fixed: `string-no-newline` memory leak for ERB templates ([#4491](https://github.com/stylelint/stylelint/pull/4491)).

## 12.0.0

- Removed: ignoring `bower_components` folder by default ([#4384](https://github.com/stylelint/stylelint/pull/4384)).
- Removed: `createRuleTester` API ([#4385](https://github.com/stylelint/stylelint/pull/4385)).
- Added: more information for custom formatters ([#4393](https://github.com/stylelint/stylelint/pull/4393)).
- Fixed: `comment-empty-line-before` false positives for selector lists and shared-line comments ([#4360](https://github.com/stylelint/stylelint/pull/4360)).
- Fixed: `font-family-no-missing-generic-family-keyword` false positives for Sass-variables with namespaces ([#4378](https://github.com/stylelint/stylelint/pull/4378)).
- Fixed: `font-weight-notation` false positives for `font-weight` ranges in `@font-face` ([#4372](https://github.com/stylelint/stylelint/pull/4372)).
- Fixed: `length-zero-no-unit` false positives for `line-height`, and for `fr` units ([#4394](https://github.com/stylelint/stylelint/pull/4394)).
- Fixed: `length-zero-no-unit` false positives for Less variables ([#4405](https://github.com/stylelint/stylelint/pull/4405)).
- Fixed: `selector-max-*` false negatives for rules with nested rules ([#4357](https://github.com/stylelint/stylelint/pull/4357)).
- Fixed: incorrect error message when parsing files with a broken syntax ([#4364](https://github.com/stylelint/stylelint/pull/4364)).

## 11.1.1

- Fixed: syntax configuration for `--syntax css` ([#4335](https://github.com/stylelint/stylelint/pull/4335)).

## 11.1.0

- Added: `css` syntax option ([#4315](https://github.com/stylelint/stylelint/pull/4315)).
- Fixed: `no-eol-whitespace` parsing problems for non-standard syntaxes ([#4313](https://github.com/stylelint/stylelint/pull/4313)).
- Fixed: `selector-pseudo-class-no-unknown` false positives for `:is` selector ([#4321](https://github.com/stylelint/stylelint/pull/4321)).

## 11.0.0

- Changed: `--report-needless-disables` CLI flag now reports needless disables and runs linting ([#4151](https://github.com/stylelint/stylelint/pull/4151)).
- Changed: display a violation at 1:1 for each file instead of throwing an error on unrecognised rules ([#4237](https://github.com/stylelint/stylelint/pull/4237)).
- Changed: always return `stylelintError` as a boolean ([#4174](https://github.com/stylelint/stylelint/pull/4174)).
- Deprecated: `createRuleTester` API ([#4279](https://github.com/stylelint/stylelint/pull/4279)).
- Added: `--reportInvalidScopeDisables` CLI flag ([#4181](https://github.com/stylelint/stylelint/pull/4181)).
- Added: `unicode-bom` rule ([#4225](https://github.com/stylelint/stylelint/pull/4225)).
- Added: `max-empty-lines` autofix ([#3667](https://github.com/stylelint/stylelint/pull/3667)).
- Added: `selector-pseudo-element-case` autofix ([#3672](https://github.com/stylelint/stylelint/pull/3672)).
- Added: `selector-*` support for all logical combinations (`:matches`, `:has`) ([#4179](https://github.com/stylelint/stylelint/pull/4179)).
- Added: `ignore: ["selectors-within-list"]` to `no-descending-specificity` ([#4176](https://github.com/stylelint/stylelint/pull/4176)).
- Added: `ignoreSelectors: []` to `property-no-unknown` ([#4275](https://github.com/stylelint/stylelint/pull/4275)).
- Fixed: Babel user configuration interfering with CSS-in-JS parser ([#4164](https://github.com/stylelint/stylelint/pull/4164)).
- Fixed: PostCSS plugin ignoring .stylelintignore ([#4186](https://github.com/stylelint/stylelint/pull/4186)).
- Fixed: `*-max-empty-lines` to only report one violation per function, selector, value list ([#4260](https://github.com/stylelint/stylelint/pull/4260)).
- Fixed: `block-no-empty` crash for `@import` statements ([#4110](https://github.com/stylelint/stylelint/pull/4110)).
- Fixed: `indentation` false positives for `<style>` tag with multiline attributes ([#4177](https://github.com/stylelint/stylelint/pull/4177)).
- Fixed: `length-zero-no-unit` false positives for inside calc function ([#4175](https://github.com/stylelint/stylelint/pull/4175)).
- Fixed: `max-line-length` false positives for multi-line `url()` ([#4169](https://github.com/stylelint/stylelint/pull/4169)).
- Fixed: `no-duplicate-selectors` false positives for selectors in the same selector list ([#4173](https://github.com/stylelint/stylelint/pull/4173)).
- Fixed: `no-unit-unknown` false positives for at-variables (Less) starting with numbers ([#4163](https://github.com/stylelint/stylelint/pull/4163)).
- Fixed: `property-no-unknown` for `overflowX` for CSS-in-JS ([#4184](https://github.com/stylelint/stylelint/pull/4184)).

## 10.1.0

- Added: `selector-max-empty-lines` autofix ([#3717](https://github.com/stylelint/stylelint/pull/3717)).
- Added: rule names for `--report-needless-disables` output ([#4071](https://github.com/stylelint/stylelint/pull/4071)).
- Added: `--output-file` CLI flag ([#4085](https://github.com/stylelint/stylelint/pull/4085)).
- Fixed: `function-calc-no-invalid` false positives for interpolation ([#4046](https://github.com/stylelint/stylelint/pull/4046)).
- Fixed: `declaration-block-semicolon-space-before` autofix with `!important` annotations ([#4016](https://github.com/stylelint/stylelint/issues/4016)).
- Fixed: `no-eol-whitespace` autofix for within comments ([#4224](https://github.com/stylelint/stylelint/pull/4224)).
- Fixed: `no-eol-whitespace` false negatives for last line without trailing EOL ([#4224](https://github.com/stylelint/stylelint/pull/4224)).
- Fixed: `selector-pseudo-class-no-unknown` false positives for `defined` ([#4081](https://github.com/stylelint/stylelint/pull/4081)).

## 10.0.1

- Fixed: minimum Node.js engine reduced to 8.7.0 ([#4032](https://github.com/stylelint/stylelint/pull/4032)).
- Fixed: `--allow-empty-input` CLI flag ([#4029](https://github.com/stylelint/stylelint/pull/4029)).
- Fixed: `color-no-invalid-hex` false positives for hashes in URLs ([#4035](https://github.com/stylelint/stylelint/pull/4035)).
- Fixed: `function-linear-gradient-no-nonstandard-direction` false positives for dollar variables ([#4027](https://github.com/stylelint/stylelint/pull/4027)).

## 10.0.0

- Removed: Node.js 6.x support. Node.js 8.15.1 or greater is now required ([#4006](https://github.com/stylelint/stylelint/pull/4006)).
- Removed: `styled` and `jsx` syntax options that were replaced with `css-in-js` in v9.10.0 ([#4007](https://github.com/stylelint/stylelint/pull/4007)).
- Changed: throws error if glob matches no files, use the `--allow-empty-input` flag for the old behaviour ([#3965](https://github.com/stylelint/stylelint/pull/3965)).
- Changed: rules are now applied in the order defined in `lib/rules/index.js` ([#3923](https://github.com/stylelint/stylelint/pull/3923)).
- Added: `at-rule-property-requirelist` rule ([#3997](https://github.com/stylelint/stylelint/pull/3997)).
- Added: `disallowInList` to `no-duplicate-selectors` ([#3936](https://github.com/stylelint/stylelint/pull/3936)).
- Added: `ignore: ["comments"]` to `block-no-empty` ([#4008](https://github.com/stylelint/stylelint/pull/4008)).
- Fixed: false negatives in declaration-based rules for CSS-in-JS ([#3933](https://github.com/stylelint/stylelint/pull/3933)).
- Fixed: `color-no-invalid-hex` false negatives for CSS-in-JS ([#3957](https://github.com/stylelint/stylelint/pull/3957)).
- Fixed: `feature-name-no-unknown` false positives for `prefers-color-scheme` ([#3951](https://github.com/stylelint/stylelint/pull/3951)).
- Fixed: `function-calc-no-invalid` false positives for negative numbers ([#3921](https://github.com/stylelint/stylelint/pull/3921)).
- Fixed: `no-descending-specificity` false positives for vendor prefixed pseudo-elements ([#3929](https://github.com/stylelint/stylelint/issues/3929)).
- Fixed: `selector-max-*` false negatives for nested at-rules ([#3959](https://github.com/stylelint/stylelint/pull/3959)).
- Fixed: Logical combinations pseudo-classes in `selector-max-universal` are now evaluated separately ([#4263](https://github.com/stylelint/stylelint/pull/4263)).
- Fixed: `value-keyword-case` autofix for single-line comments within maps ([#4019](https://github.com/stylelint/stylelint/pull/4019)).

## 9.10.1

- Fixed: "fatal: Not a git repository" error ([#3915](https://github.com/stylelint/stylelint/pull/3915)).
- Fixed: unintended increase in package size ([#3915](https://github.com/stylelint/stylelint/pull/3915)).

## 9.10.0

- Added: support for ordinary regular expressions anywhere a regex string is accepted in rule config ([#3799](https://github.com/stylelint/stylelint/pull/3799)).
- Added: `css-in-js` syntax option that will replace the existing `styled` and `jsx` ones ([#3872](https://github.com/stylelint/stylelint/pull/3872)).
- Added: `function-calc-no-invalid` rule ([#3833](https://github.com/stylelint/stylelint/pull/3833)).
- Added: `ignore: ["next-sibling"]` to `selector-max-type` ([#3832](https://github.com/stylelint/stylelint/pull/3832)).
- Added: `declaration-block-semicolon-space-after` autofix ([#3865](https://github.com/stylelint/stylelint/pull/3865)).
- Fixed: autofix is now disabled when a stylelint processors is used ([#3873](https://github.com/stylelint/stylelint/pull/3873)).
- Fixed: `CssSyntaxError` for functions in template literals ([#3869](https://github.com/stylelint/stylelint/pull/3869)).
- Fixed: `no-descending-specificity` false positives for styled-components ([#3875](https://github.com/stylelint/stylelint/pull/3875)).
- Fixed: `no-duplicate-selectors` false positives for styled-components ([#3875](https://github.com/stylelint/stylelint/pull/3875)).
- Fixed: `selector-pseudo-class-no-unknown` false positives for `focus-visible` ([#3887](https://github.com/stylelint/stylelint/pull/3887)).
- Fixed: `selector-max-universal` false positives for flush comments containing a comma ([#3817](https://github.com/stylelint/stylelint/pull/3817)).
- Fixed: `shorthand-property-redundant-values` false positives for negative values ([#3888](https://github.com/stylelint/stylelint/pull/3888)).

## 9.9.0

- Added: `selector-list-comma-newline-after` autofix ([#3815](https://github.com/stylelint/stylelint/pull/3815)).
- Added: `value-list-max-empty-lines` autofix ([#3814](https://github.com/stylelint/stylelint/pull/3814)).
- Added: `ignoreSelectors: []` to `selector-no-vendor-prefix` ([#3748](https://github.com/stylelint/stylelint/pull/3748)).
- Fixed: ignored files are no longer parsed ([#3801](https://github.com/stylelint/stylelint/pull/3801)).
- Fixed: ignore `&:extend` for Less syntax ([#3824](https://github.com/stylelint/stylelint/pull/3824)).
- Fixed: `--report-needless-disables` CLI flag ([#3819](https://github.com/stylelint/stylelint/pull/3819)).
- Fixed: `font-family-no-missing-generic-family-keyword` false positives for system fonts ([#3794](https://github.com/stylelint/stylelint/pull/3794)).

## 9.8.0

- Added: `value-keyword-case` autofix ([#3775](https://github.com/stylelint/stylelint/pull/3775)).
- Added: `ignore: ["pseudo-classes"]` to `max-nesting-depth` ([#3724](https://github.com/stylelint/stylelint/pull/3724)).
- Added: `ignoreTypes:[]` to `selector-type-case` ([#3758](https://github.com/stylelint/stylelint/pull/3758)).
- Added: `ignoreFunctions:[]` to `unit-no-unkown` ([#3736](https://github.com/stylelint/stylelint/pull/3736)).
- Fixed: error for single-line Sass comments ([#3772](https://github.com/stylelint/stylelint/pull/3772)).
- Fixed: `at-rule-*` false positives for Less variables and mixins ([#3767](https://github.com/stylelint/stylelint/pull/3767)).
- Fixed: `max-empty-lines` false positives for final newlines ([#3785](https://github.com/stylelint/stylelint/pull/3785)).

## 9.7.1

- Fixed: `at-rule-*` false positives for Less variables and mixins ([#3759](https://github.com/stylelint/stylelint/pull/3759)).

## 9.7.0

- Added: allow globally installed configuration ([#3642](https://github.com/stylelint/stylelint/pull/3642)).
- Added: `media-feature-parentheses-space-inside` autofix ([#3720](https://github.com/stylelint/stylelint/pull/3720)).
- Added: `selector-descendant-combinator-no-non-space` autofix ([#3565](https://github.com/stylelint/stylelint/pull/3565)).
- Added: `unit-case` autofix ([#3725](https://github.com/stylelint/stylelint/pull/3725)).
- Fixed: false negatives for Less at-imports ([#3687](https://github.com/stylelint/stylelint/pull/3687)).
- Fixed: SyntaxError when an empty string is used for a rule's custom message ([#3743](https://github.com/stylelint/stylelint/pull/3743)).
- Fixed: `max-empty-lines` false positives for empty lines before `</style>` ([#3708](https://github.com/stylelint/stylelint/pull/3708)).
- Fixed: `selector-max-specificity` false positives for functional psuedo-classes ([#3711](https://github.com/stylelint/stylelint/pull/3711)).

## 9.6.0

- Added: suggestions for invalid CLI options ([#3622](https://github.com/stylelint/stylelint/pull/3622)).
- Added: `no-empty-first-line` rule ([#3650](https://github.com/stylelint/stylelint/pull/3650)).
- Added: `at-rule-name-space-after` autofix ([#3653](https://github.com/stylelint/stylelint/pull/3653)).
- Added: `block-closing-brace-empty-line-before` autofix ([#3598](https://github.com/stylelint/stylelint/pull/3617)).
- Added: `block-closing-brace-space-before` autofix ([#3673](https://github.com/stylelint/stylelint/pull/3673)).
- Added: `comment-whitespace-inside` autofix ([#3619](https://github.com/stylelint/stylelint/pull/3619)).
- Added: `declaration-bang-space-after` autofix ([#3598](https://github.com/stylelint/stylelint/pull/3598)).
- Added: `declaration-bang-space-before` autofix ([#3592](https://github.com/stylelint/stylelint/pull/3592)).
- Added: `declaration-colon-newline-after` autofix ([#3588](https://github.com/stylelint/stylelint/pull/3588)).
- Added: `function-comma-space-after` autofix ([#3555](https://github.com/stylelint/stylelint/pull/3555)).
- Added: `function-comma-space-before` autofix ([#3596](https://github.com/stylelint/stylelint/pull/3596)).
- Added: `function-name-case` autofix ([#3674](https://github.com/stylelint/stylelint/pull/3674)).
- Added: `function-max-empty-lines` autofix ([#3645](https://github.com/stylelint/stylelint/pull/3645)).
- Added: `function-parentheses-newline-inside` autofix ([#3601](https://github.com/stylelint/stylelint/pull/3601)).
- Added: `function-whitespace-after` autofix ([#3648](https://github.com/stylelint/stylelint/pull/3648)).
- Added: `media-feature-colon-space-after` autofix ([#3623](https://github.com/stylelint/stylelint/pull/3623)).
- Added: `media-feature-colon-space-before` autofix ([#3637](https://github.com/stylelint/stylelint/pull/3637)).
- Added: `media-feature-name-case` autofix ([#3685](https://github.com/stylelint/stylelint/pull/3685)).
- Added: `media-feature-range-operator-space-after` autofix ([#3639](https://github.com/stylelint/stylelint/pull/3639)).
- Added: `media-feature-range-operator-space-before` autofix ([#3618](https://github.com/stylelint/stylelint/pull/3618)).
- Added: `media-query-list-comma-newline-after` autofix ([#3643](https://github.com/stylelint/stylelint/pull/3643)).
- Added: `media-query-list-comma-space-after` autofix ([#3607](https://github.com/stylelint/stylelint/pull/3607)).
- Added: `media-query-list-comma-space-before` autofix ([#3640](https://github.com/stylelint/stylelint/pull/3640)).
- Added: `function-parentheses-space-inside` autofix ([#3563](https://github.com/stylelint/stylelint/pull/3563)).
- Added: `selector-attribute-brackets-space-inside` autofix ([#3605](https://github.com/stylelint/stylelint/pull/3605)).
- Added: `selector-attribute-operator-space-after` autofix ([#3641](https://github.com/stylelint/stylelint/pull/3641)).
- Added: `selector-attribute-operator-space-before` autofix ([#3603](https://github.com/stylelint/stylelint/pull/3603)).
- Added: `selector-pseudo-class-case` autofix ([#3671](https://github.com/stylelint/stylelint/pull/3671)).
- Added: `selector-pseudo-class-parentheses-space-inside` autofix ([#3646](https://github.com/stylelint/stylelint/pull/3646)).
- Added: `selector-type-case` autofix ([#3668](https://github.com/stylelint/stylelint/pull/3668)).
- Added: `no-eol-whitespace` autofix ([#3615](https://github.com/stylelint/stylelint/pull/3615)).
- Added: `no-extra-semicolons` autofix ([#3574](https://github.com/stylelint/stylelint/pull/3574)).
- Added: `value-list-comma-newline-after` autofix ([#3616](https://github.com/stylelint/stylelint/pull/3616)).
- Added: `value-list-comma-space-after` autofix ([#3558](https://github.com/stylelint/stylelint/pull/3558)).
- Added: `value-list-comma-space-before` autofix ([#3597](https://github.com/stylelint/stylelint/pull/3597)).
- Added: `baseIndentLevel` to `indentation` ([#3557](https://github.com/stylelint/stylelint/pull/3557)).
- Fixed: autofix for 5 whitespace rules ([#3621](https://github.com/stylelint/stylelint/pull/3621)).
- Fixed: `linebreaks` TypeError ([#3636](https://github.com/stylelint/stylelint/pull/3636)).
- Fixed: `max-empty-lines` incorrect line reporting ([#3530](https://github.com/stylelint/stylelint/pull/3530)).
- Fixed: `media-query-list-comma-newline-after` false positives for trailing comment ([#3657](https://github.com/stylelint/stylelint/pull/3657)).
- Fixed: `no-descending-specificity` false positives for CSS Modules functional pseudo-classes ([#3623](https://github.com/stylelint/stylelint/pull/3623)).

## 9.5.0

- Added: bundled support for styles in CSS-in-JS object literals ([#3506](https://github.com/stylelint/stylelint/pull/3506)).
- Added: `--print-config` CLI flag ([#3532](https://github.com/stylelint/stylelint/pull/3532)).
- Added: `block-closing-brace-newline-before` autofix ([#3442](https://github.com/stylelint/stylelint/pull/3442)).
- Added: `block-opening-brace-newline-before` autofix ([#3518](https://github.com/stylelint/stylelint/pull/3518)).
- Added: `block-opening-brace-space-after` autofix ([#3520](https://github.com/stylelint/stylelint/pull/3520)).
- Added: `block-opening-brace-newline-after` autofix ([#3441](https://github.com/stylelint/stylelint/pull/3441)).
- Added: `declaration-block-semicolon-newline-after` autofix ([#3545](https://github.com/stylelint/stylelint/pull/3545)).
- Added: `declaration-block-semicolon-space-before` autofix ([#3554](https://github.com/stylelint/stylelint/pull/3554)).
- Added: `declaration-colon-space-after` autofix ([#3538](https://github.com/stylelint/stylelint/pull/3538)).
- Added: `selector-list-comma-newline-before` autofix ([#3517](https://github.com/stylelint/stylelint/pull/3517)).
- Added: `selector-list-comma-space-after` autofix ([#3490](https://github.com/stylelint/stylelint/pull/3490)).
- Added: `unix` formatter ([#3524](https://github.com/stylelint/stylelint/pull/3524)).
- Fixed: `selector-descendant-combinator-no-non-space` false positives for calculations with parenthesis ([#3508](https://github.com/stylelint/stylelint/pull/3508)).

## 9.4.0

- Added: bundled support for styles in CSS-in-JS template literals ([#3405](https://github.com/stylelint/stylelint/pull/3405)).
- Added: `linebreaks` rule ([#3289](https://github.com/stylelint/stylelint/pull/3289)).
- Added: `compact` formatter ([#3488](https://github.com/stylelint/stylelint/pull/3488)).
- Added: `at-rule-semicolon-newline-after` autofix ([#3450](https://github.com/stylelint/stylelint/pull/3450)).
- Added: `block-closing-brace-newline-after` autofix ([#3443](https://github.com/stylelint/stylelint/pull/3443)).
- Added: `block-opening-brace-space-before` autofix ([#3438](https://github.com/stylelint/stylelint/pull/3438)).
- Added: `declaration-block-trailing-semicolon` autofix ([#3382](https://github.com/stylelint/stylelint/pull/3382)).
- Added: `declaration-colon-space-before` autofix ([#3445](https://github.com/stylelint/stylelint/pull/3445)).
- Added: `property-case` autofix ([#3448](https://github.com/stylelint/stylelint/pull/3448)).
- Added: `selector-combinator-space-after` autofix ([#3446](https://github.com/stylelint/stylelint/pull/3446)).
- Added: `selector-combinator-space-before` autofix ([#3457](https://github.com/stylelint/stylelint/pull/3457)).
- Added: `selector-list-comma-space-before` autofix ([#3447](https://github.com/stylelint/stylelint/pull/3447)).
- Fixed: `block-opening-brace-newline-after` false positives for nested rule-sets prefixed with comments ([#3383](https://github.com/stylelint/stylelint/pull/3383)).
- Fixed: `declaration-block-trailing-semicolon` report of errors with the `--fix` option ([#3493](https://github.com/stylelint/stylelint/pull/3493)).
- Fixed: `font-family-name-quotes` false positives for `system-ui` system font ([#3463](https://github.com/stylelint/stylelint/pull/3463)).
- Fixed: `keyframes-name-pattern` support for raw JS RegExp ([#3437](https://github.com/stylelint/stylelint/pull/3437)).
- Fixed: `media-feature-name-no-unknown` false positives for level 5 names ([#3397](https://github.com/stylelint/stylelint/pull/3397)).
- Fixed: `no-descending-specificity` false positives for #{&} ([#3420](https://github.com/stylelint/stylelint/pull/3420)).
- Fixed: `no-missing-end-of-source-newline` false positives for style attributes ([#3485](https://github.com/stylelint/stylelint/pull/3485)).

## 9.3.0

- Added: support for `<style>` tags and `style=""` attributes in XML and XSLT files ([#3386](https://github.com/stylelint/stylelint/pull/3386)).
- Added: `globbyOptions` option ([#3339](https://github.com/stylelint/stylelint/pull/3339)).
- Added: `keyframes-name-pattern` rule ([#3321](https://github.com/stylelint/stylelint/pull/3321)).
- Added: `media-feature-name-value-whitelist` rule ([#3320](https://github.com/stylelint/stylelint/pull/3320)).
- Added: `selector-pseudo-element-colon-notation` autofix ([#3345](https://github.com/stylelint/stylelint/pull/3345)).
- Fixed: `.vue` files throwing errors for `<style lang="stylus">` and `<style lang="postcss">` ([#3331](https://github.com/stylelint/stylelint/pull/3331)).
- Fixed: `declaration-block-no-*` false positives for non-standard syntax ([#3381](https://github.com/stylelint/stylelint/pull/3381)).
- Fixed: `function-whitespace-after` false positives for "/" ([#3132](https://github.com/stylelint/stylelint/pull/3132)).
- Fixed: `length-zero-no-unit` incorrect autofix for at-includes ([#3347](https://github.com/stylelint/stylelint/pull/3347)).
- Fixed: `max-nesting-depth` false positives for nested properties ([#3349](https://github.com/stylelint/stylelint/pull/3349)).
- Fixed: `no-empty-source` false positives on vue external sources `<style src="*">` tag ([#3331](https://github.com/stylelint/stylelint/pull/3331)).
- Fixed: `max-line-length` false positives for non-CSS blocks ([#3367](https://github.com/stylelint/stylelint/pull/3367)).
- Fixed: `no-eol-whitespace` false positives for non-CSS blocks ([#3367](https://github.com/stylelint/stylelint/pull/3367)).
- Fixed: `no-extra-semicolons` false positives for non-CSS blocks ([#3367](https://github.com/stylelint/stylelint/pull/3367)).
- Fixed: `no-missing-end-of-source-newline` false positives for non-CSS blocks ([#3367](https://github.com/stylelint/stylelint/pull/3367)).

## 9.2.1

- Fixed: `cache` option hiding CssSyntaxError outputs ([#3258](https://github.com/stylelint/stylelint/pull/3258)).
- Fixed: regression with processors (e.g. styled-components) ([#3261](https://github.com/stylelint/stylelint/pull/3261)).
- Fixed: `no-descending-specificity` false positives for Sass nested properties ([#3283](https://github.com/stylelint/stylelint/pull/3283)).
- Fixed: `selector-pseudo-class-no-unknown` false positives proprietary webkit pseudo classes when applied to a simple selector ([#3271](https://github.com/stylelint/stylelint/pull/3271)).

## 9.2.0

- Added: `selector-max-pseudo-class` rule ([#3195](https://github.com/stylelint/stylelint/pull/3195)).
- Fixed: slow `require('stylelint')` time ([#3242](https://github.com/stylelint/stylelint/pull/3242)).
- Fixed: autofix erroneously writing to unchanged files ([#3241](https://github.com/stylelint/stylelint/pull/3241)).
- Fixed: false negatives for template literals within script tags by updating postcss-html dependency ([#3238](https://github.com/stylelint/stylelint/pull/3238)).
- Fixed: `indentation` false positives for at-root ([#3225](https://github.com/stylelint/stylelint/pull/3225)).
- Fixed: `max-empty-lines` false positives for non-CSS blocks ([#3229](https://github.com/stylelint/stylelint/pull/3229)).
- Fixed: `no-empty-source` false positives for non-CSS blocks ([#3240](https://github.com/stylelint/stylelint/pull/3240)).
- Fixed: `string-no-newline` false positives for non-CSS blocks ([#3228](https://github.com/stylelint/stylelint/pull/3228)).

## 9.1.3

- Fixed: invalid HTML causing CssSyntaxError by updating postcss-html dependency ([#3214](https://github.com/stylelint/stylelint/pull/3214)).
- Fixed: empty markdown block causing CssSyntaxError by updating postcss-html dependency ([#3214](https://github.com/stylelint/stylelint/pull/3214)).

## 9.1.2

- Fixed: parsing of markdown files by updating postcss-html dependency ([#3207](https://github.com/stylelint/stylelint/pull/3207)).

## 9.1.1

- Fixed: missing `signal-exit` dependency ([#3186](https://github.com/stylelint/stylelint/pull/3186)).

## 9.1.0

- Added: `ignore: ["first-nested"]` to `at-rule-empty-line-before` ([#3179](https://github.com/stylelint/stylelint/pull/3179)).
- Added: `ignore: ["first-nested"]` to `rule-empty-line-before` ([#3179](https://github.com/stylelint/stylelint/pull/3179)).
- Fixed: unnecessary Open Collective postinstall message ([#3180](https://github.com/stylelint/stylelint/pull/3180)).

## 9.0.0

- Removed: Node.js 4.x support. Node.js 6.x or greater is now required ([#3075](https://github.com/stylelint/stylelint/pull/3087)).
- Added: (experimental) support for [SASS](http://sass-lang.com/) syntax ([#2503](https://github.com/stylelint/stylelint/pull/2503)).
- Added: allow processors to handle PostCSS errors ([#3063](https://github.com/stylelint/stylelint/pull/3063)).
- Added: `--max-warnings` CLI flag ([#2942](https://github.com/stylelint/stylelint/pull/2942)).
- Added: `selector-combinator-*list` rules ([#3088](https://github.com/stylelint/stylelint/pull/3088)).
- Added: `selector-pseudo-element-*list` rules ([#3104](https://github.com/stylelint/stylelint/pull/3087)).
- Added: `ignore: ["first-nested"]` to `custom-property-empty-line-before` ([#3104](https://github.com/stylelint/stylelint/pull/3104)).
- Added: `ignore: ["first-nested"]` to `declaration-empty-line-before` ([#3103](https://github.com/stylelint/stylelint/pull/3103)).
- Added: `ignoreProperties: []` to `property-no-vendor-prefix` ([#3089](https://github.com/stylelint/stylelint/pull/3089)).
- Fixed: `font-family-name-quotes` unicode range increased ([#2974](https://github.com/stylelint/stylelint/pull/2974)).
- Fixed: `selector-max-id` in nested at-statements ([#3113](https://github.com/stylelint/stylelint/pull/3113)).

## 8.4.0

- Added: `except: ["after-closing-brace"]` to `block-closing-brace-empty-line-before` ([#3011](https://github.com/stylelint/stylelint/pull/3011)).
- Fixed: unmet peer dependency warning for `postcss-sass` ([#3040](https://github.com/stylelint/stylelint/pull/3040)).
- Fixed: false positives for CSS within comments in `*.pcss` files ([#3064](https://github.com/stylelint/stylelint/pull/3064)).
- Fixed: `font-family-no-missing-generic-family-keyword` configuration ([#3039](https://github.com/stylelint/stylelint/pull/3039)).
- Fixed: `indentation` autofix for HTML ([#3044](https://github.com/stylelint/stylelint/pull/3044)).

## 8.3.1

- Fixed: `font-family-no-missing-generic-family-keyword` false positives for at-font-face ([#3034](https://github.com/stylelint/stylelint/issues/3034)).

## 8.3.0

- Added: autofix support for stdin input ([#2787](https://github.com/stylelint/stylelint/pull/2787)).
- Added: support for `<style>` tags and markdown fences in `.vue` and `.html` files ([#2975](https://github.com/stylelint/stylelint/pull/2975)).
- Added: `font-family-no-missing-generic-family-keyword` rule ([#2930](https://github.com/stylelint/stylelint/pull/2930)).
- Added: `no-duplicate-at-import-rules` rule ([#2963](https://github.com/stylelint/stylelint/pull/2963)).
- Added: `number-leading-zero` autofix ([#2921](https://github.com/stylelint/stylelint/issues/2921)).
- Added: `number-no-trailing-zeros` autofix ([#2947](https://github.com/stylelint/stylelint/issues/2947)).
- Added: `shorthand-property-no-redundant-values` autofix ([#2956](https://github.com/stylelint/stylelint/issues/2956)).
- Added: `string-quotes` autofix ([#2959](https://github.com/stylelint/stylelint/pull/2959)).
- Added: `ignore: ["custom-properties"]` option to `length-zero-no-unit` ([#2967](https://github.com/stylelint/stylelint/pull/2967)).
- Added: `except: ["inside-block"]` option to `rule-empty-line-before` ([#2982](https://github.com/stylelint/stylelint/pull/2982)).
- Added: `ignoreValues` to `value-no-vendor-prefix` ([#3015](https://github.com/stylelint/stylelint/pull/3015)).
- Added: `ignoreMediaFeatureNames` to `unit-blacklist` ([#3027](https://github.com/stylelint/stylelint/pull/3027)).
- Fixed: `comment-empty-line-before` false positives for shared-line comments ([#2986](https://github.com/stylelint/stylelint/issues/2986)).
- Fixed: `unit-*` false positives for spaceless multiplication ([#2948](https://github.com/stylelint/stylelint/issues/2948)).

## 8.2.0

- Added: autofix of syntax errors in standard CSS e.g. unclosed braces and brackets ([#2886](https://github.com/stylelint/stylelint/issues/2886)).
- Added: `length-zero-no-unit` autofix ([#2861](https://github.com/stylelint/stylelint/issues/2861)).
- Added: `selector-max-specificity` support for level 4 evaluation context pseudo-classes ([#2857](https://github.com/stylelint/stylelint/issues/2857)).
- Added: `ignoreUnits` option to `number-max-precision` ([#2941](https://github.com/stylelint/stylelint/pull/2941)).
- Added: `ignoreSelectors` option to `selector-max-specificity` ([#2857](https://github.com/stylelint/stylelint/pull/2857)).
- Added: `ignoreProperties` option to `value-keyword-case` ([#2937](https://github.com/stylelint/stylelint/pull/2937)).
- Fixed: `*-empty-line-before` false negatives and positives when two or more `except: [*]` options were triggered ([#2920](https://github.com/stylelint/stylelint/issues/2920)).
- Fixed: `*-empty-line-before` false positives for CSS in HTML ([#2854](https://github.com/stylelint/stylelint/issues/2854)).
- Fixed: `rule-empty-line-before` false positives for `ignore: ["inside-block"]` and CSS in HTML ([#2894](https://github.com/stylelint/stylelint/issues/2894)).
- Fixed: `rule-empty-line-before` false positives for `except: ["after-single-line-comment"]` and preceding shared-line comments ([#2920](https://github.com/stylelint/stylelint/issues/2920)).
- Fixed: `selector-list-comma-newline-after` false positives for shared-line comments separated by more than once space ([#2915](https://github.com/stylelint/stylelint/issues/2915)).
- Fixed: `selector-pseudo-class-no-unknown` false positives when using chained pseudo-classes ([#2810](https://github.com/stylelint/stylelint/issues/2810)).
- Fixed: `string-quotes` false positives for `@charset` and single quotes ([#2902](https://github.com/stylelint/stylelint/issues/2902)).
- Fixed: `unit-no-unknown` false positives for spaceless multiplication and division in `calc()` functions ([#2848](https://github.com/stylelint/stylelint/issues/2848)).

## 8.1.1

- Fixed: `--ignore-pattern` in CLI ([#2851](https://github.com/stylelint/stylelint/issues/2851)).

## 8.1.0

- Added: Allow specifying `codeFilename` to `createStylelintResult` for raw code linting standalone API ([#2450](https://github.com/stylelint/stylelint/issues/2450)).
- Added: `ignorePattern` option (`--ignore-pattern` in CLI), to allow patterns of files to ignored ([#2834](https://github.com/stylelint/stylelint/issues/2834)).
- Added: More rules now support experimental autofixing. Use `--fix` CLI parameter or `fix: true` Node.js API options property. Newly supported rules:
  - `color-hex-length` ([#2781](https://github.com/stylelint/stylelint/pull/2781)).
  - `no-missing-end-of-source-newline` ([#2772](https://github.com/stylelint/stylelint/pull/2772)).
- Fixed: `*-empty-line-before` false positives shared-line comments and `"first-nested"` option ([#2827](https://github.com/stylelint/stylelint/issues/2827)).
- Fixed: `color-hex-length` false positives for ID references in `url` functions ([#2806](https://github.com/stylelint/stylelint/issues/2806)).
- Fixed: `indentation` false positives for Less parametric mixins with rule block/snippet ([#2744](https://github.com/stylelint/stylelint/pull/2744)).
- Fixed: `no-empty-source` compatability with `postcss-html` custom syntax ([#2798](https://github.com/stylelint/stylelint/issues/2798)).
- Fixed: `no-extra-semicolons` false negatives where instances were not detected when followed by multiple comments ([#2678](https://github.com/stylelint/stylelint/issues/2678)).
- Fixed: `selector-max-specificity` cannot parse selector violation for Less mixins ([#2677](https://github.com/stylelint/stylelint/pull/2677)).

## 8.0.0

This release is accompanied by:

- A new [semantic version policy](docs/about/semantic-versioning.md). The use of the tilde (`~`) in `package.json` is now recommended, e.g. `"stylelint": "~8.0.0"`, to guarantee the results of your builds ([#1865](https://github.com/stylelint/stylelint/issues/1865)).
- A new [VISION document](docs/about/vision.md), complemented by ([#2704](https://github.com/stylelint/stylelint/pull/2704)):
  - The restructuring of the [list of rules](docs/user-guide/rules/list.md) into three groups:
    - [Possible errors](docs/user-guide/rules/list.md#possible-errors).
    - [Limit language features](docs/user-guide/rules/list.md#limit-language-features).
    - [Stylistic issues](docs/user-guide/rules/list.md#stylistic-issues).
  - The release of a new sharable config, [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended). This config only turns on the [possible error](docs/user-guide/rules/list.md#possible-errors) rules. [`stylelint-config-standard`](https://github.com/stylelint/stylelint-config-standard) now builds on top of the recommended config by turning on over 60 additional [stylistic rules](docs/user-guide/rules/list.md#stylistic-issues).

Changes:

- Removed: the 21 rules deprecated in [`7.8.0`](#780) & [`7.12.0`](#7120) ([#2422](https://github.com/stylelint/stylelint/issues/2422) & [#2693](https://github.com/stylelint/stylelint/issues/2693)).
  - `block-no-single-line`.
  - `custom-property-no-outside-root`
  - `declaration-block-no-ignored-properties`.
  - `declaration-block-properties-order`.
  - `function-url-data-uris`.
  - `media-feature-no-missing-punctuation`.
  - `no-browser-hacks`.
  - `no-indistinguishable-colors`.
  - `no-unsupported-browser-features`.
  - `root-no-standard-properties`
  - `rule-nested-empty-line-before`.
  - `rule-non-nested-empty-line-before`.
  - `selector-no-attribute`.
  - `selector-no-combinator`.
  - `selector-no-empty`.
  - `selector-no-id`.
  - `selector-no-type`.
  - `selector-no-universal`.
  - `selector-root-no-composition`.
  - `stylelint-disable-reason`.
  - `time-no-imperceptible`.
- Removed: the 4 options deprecated in [`7.8.0`](#780) ([#2433](https://github.com/stylelint/stylelint/issues/2433)).
  - `"all-nested"` option for `at-rule-empty-line-before`.
  - `"blockless-group"` option for `at-rule-empty-line-before`.
  - `"between-comments"` option for `comment-empty-line-before`.
  - `"at-rules-without-declaration-blocks"` option for `max-nesting-depth`.
- Changed: compatibility with `postcss` from `@5` to `@6` ([#2561](https://github.com/stylelint/stylelint/issues/2561)).
- Changed: parse errors now trigger exit with non-zero code ([#2713](https://github.com/stylelint/stylelint/issues/2713)).
- Changed: `report-needless-disables` now exits with non-zero code ([#2341](https://github.com/stylelint/stylelint/issues/2341)).
- Changed: `*-blacklist` and `*-whitelist` (and `ignore* []` secondary options) are now case sensitive. Use regular expressions with the `i` flag for case insensitivity ([#2709](https://github.com/stylelint/stylelint/issues/2709)).
- Changed: `*-empty-line-before` now correctly handle shared-line comments ([#2262](https://github.com/stylelint/stylelint/issues/2262)).
- Changed: `*-empty-line-before` now consider line as empty if it contains whitespace only ([#2440](https://github.com/stylelint/stylelint/pull/2440)).
- Changed: `function-linear-gradient-no-nonstandard-direction` now checks all linear-gradients in a value list ([#2496](https://github.com/stylelint/stylelint/pull/2496)).
- Changed: `selector-max-compound-selectors` now checks all resolved selectors, rather than just the deepest ([#2350](https://github.com/stylelint/stylelint/issues/2350)).
- Added: `disableDefaultIgnores` option (`--disable-default-ignores` in CLI), to allow linting of `node_modules` and `bower_components` directories ([#2464](https://github.com/stylelint/stylelint/pull/2464)).
- Added: more efficient file ignoring with `.stylelintignore` ([#2464](https://github.com/stylelint/stylelint/pull/2464)).
- Added: `ignore: ["child"]` option to `selector-max-type` ([#2701](https://github.com/stylelint/stylelint/pull/2701)).
- Fixed: `declaration-block-no-redundant-longhand-properties` and `declaration-block-no-shorthand-property-overrides` understand more shorthand properties ([#2354](https://github.com/stylelint/stylelint/pull/2354)).
- Fixed: `selector-max-type` no longer produces false negatives for when child, next-sibling and following-sibling combinators are used with `ignore: ["descendant"]` ([#2701](https://github.com/stylelint/stylelint/pull/2701)).

## 7.13.0

- Added: `ignoreAttributes` option to `selector-max-attribute` ([#2722](https://github.com/stylelint/stylelint/pull/2722)).
- Fixed: `selector-combinator-space-*` false positives for CSS namespaced type selectors ([#2715](https://github.com/stylelint/stylelint/pull/2715)).
- Fixed: `selector-max-specificity` now ignores nested non-standard selectors ([#2685](https://github.com/stylelint/stylelint/pull/2685)).

## 7.12.0

- Deprecated: 6 rules, each has been replaced by a more configurable alternative ([#2679](https://github.com/stylelint/stylelint/pull/2679)).
  - `function-url-data-uris` rule. Use either `function-url-scheme-blacklist` or `function-url-scheme-whitelist`.
  - `selector-no-attribute` rule. Use `selector-max-attribute` with `0` as its primary option.
  - `selector-no-combinator` rule. Use `selector-max-combinators` with `0` as its primary option.
  - `selector-no-id` rule. Use `selector-max-id` with `0` as its primary option.
  - `selector-no-type` rule. Use `selector-max-type` with `0` as its primary option.
  - `selector-no-universal` rule. Use `selector-max-universal` with `0` as its primary option.
- Added: `function-url-scheme-blacklist` rule ([#2626](https://github.com/stylelint/stylelint/pull/2626)).
- Added: `function-url-scheme-whitelist` regex support ([#2662](https://github.com/stylelint/stylelint/pull/2662)).
- Added: `selector-max-attribute` rule ([#2628](https://github.com/stylelint/stylelint/pull/2628)).
- Added: `selector-max-combinators` rule ([#2658](https://github.com/stylelint/stylelint/pull/2658)).
- Added: `selector-max-id` rule ([#2654](https://github.com/stylelint/stylelint/pull/2654)).
- Added: `selector-max-type` rule ([#2665](https://github.com/stylelint/stylelint/pull/2665)).
- Added: `selector-max-universal` rule ([#2653](https://github.com/stylelint/stylelint/pull/2653)).
- Fixed: `--fix` no longer crashes when used with ignored files ([#2652](https://github.com/stylelint/stylelint/pull/2652)).
- Fixed: `max-*` rules now use singular and plural nouns in their messages ([#2663](https://github.com/stylelint/stylelint/pull/2663)).

## 7.11.1

- Fixed: `media-feature-name-*list` now accept arrays for their primary options ([#2632](https://github.com/stylelint/stylelint/pull/2632)).
- Fixed: `selector-*` now ignore custom property sets ([#2634](https://github.com/stylelint/stylelint/pull/2634)).
- Fixed: `selector-pseudo-class-no-unknown` now ignores Less `:extend` ([#2625](https://github.com/stylelint/stylelint/pull/2625)).

## 7.11.0

- Added: experimental autofixing ([#2467](https://github.com/stylelint/stylelint/pull/2467), [#2500](https://github.com/stylelint/stylelint/pull/2500), [#2529](https://github.com/stylelint/stylelint/pull/2529) and [#2577](https://github.com/stylelint/stylelint/pull/2577)). Use `--fix` CLI parameter or `fix: true` Node.js API options property. Supported rules:
  - `at-rule-empty-line-before`
  - `at-rule-name-case`
  - `color-hex-case`
  - `comment-empty-line-before`
  - `custom-property-empty-line-before`
  - `declaration-empty-line-before`
  - `indentation`
  - `rule-empty-line-before`
- Added: `selector-max-class` rule.
- Added: `ignore: ["custom-elements"]` option to `selector-type-no-unknown` ([#2366](https://github.com/stylelint/stylelint/pull/2366)).
- Fixed: "Cannot find module 'pify'" regression in node@4 with npm@2 ([#2614](https://github.com/stylelint/stylelint/pull/2614)).
- Fixed: no error is thrown when linting a string with `cache` enabled ([#2494](https://github.com/stylelint/stylelint/pull/2494)).
- Fixed: Less `:extend` is now ignored ([#2571](https://github.com/stylelint/stylelint/pull/2571)).
- Fixed: `function-parentheses-space-inside` now ignores functions without parameters ([#2587](https://github.com/stylelint/stylelint/pull/2587)).
- Fixed: `length-zero-no-unit` now correctly handles newlines and no spaces after colon ([#2477](https://github.com/stylelint/stylelint/pull/2477)).
- Fixed: `selector-descendant-combinator-no-non-space` and `selector-combinator-space-before/after` now understand and check `>>>` shadow-piercing combinator ([#2509](https://github.com/stylelint/stylelint/pull/2509)).
- Fixed: `selector-descendant-combinator-no-non-space` now ignores Less guards ([#2557](https://github.com/stylelint/stylelint/pull/2557)).
- Fixed: `selector-pseudo-class-no-unknown` now checks `@page` at-rules and supports `@page` pseudo-classes ([#2445](https://github.com/stylelint/stylelint/pull/2445)).
- Fixed: `selector-pseudo-class-no-unknown` now considers `focus-ring`, `playing` and `paused` to be known ([#2507](https://github.com/stylelint/stylelint/pull/2507)).
- Fixed: `selector-type-no-unknown` now ignores MathML tags ([#2478](https://github.com/stylelint/stylelint/pull/2478)).
- Fixed: `selector-type-no-unknown` now ignores the `/deep/` shadow-piercing combinator ([#2508](https://github.com/stylelint/stylelint/pull/2508)).
- Fixed: `value-keyword-case` now ignores variables with signs ([#2558](https://github.com/stylelint/stylelint/pull/2558)).

## 7.10.1

- Fixed: scope is kept when using `schema.preceedingPlugins` ([#2455](https://github.com/stylelint/stylelint/pull/2455)).

## 7.10.0

- Added: support for asynchronous plugin rules ([#2351](https://github.com/stylelint/stylelint/pull/2351)).
- Added: `cache` option to store the info about processed files in order to only operate on the changed ones the next time you run stylelint ([#2293](https://github.com/stylelint/stylelint/pull/2293)).
- Added: `at-rule-semicolon-space-before` rule ([#2388](https://github.com/stylelint/stylelint/pull/2388)).
- Added: `ignore: ["comments"]` to `max-empty-lines` ([#2401](https://github.com/stylelint/stylelint/pull/2401)).
- Added: `ignore: ["default-namespace"]` to `selector-type-no-unknown` ([#2461](https://github.com/stylelint/stylelint/pull/2461)).
- Added: `ignoreDefaultNamespaces` option to `selector-type-no-unknown` ([#2461](https://github.com/stylelint/stylelint/pull/2461)).
- Fixed: more helpful messages when file globs do not match any files ([#2328](https://github.com/stylelint/stylelint/pull/2328)).
- Fixed: `decl/` folder of Flow types is shipped with the package, for consumers that use Flow ([#2322](https://github.com/stylelint/stylelint/issues/2322)).
- Fixed: `function-url-scheme-whitelist` was working incorrectly if more than one URL scheme were specified ([#2447](https://github.com/stylelint/stylelint/pull/2447)).
- Fixed: `no-duplicate-selector` now includes the duplicate selector's first usage line in message ([#2415](https://github.com/stylelint/stylelint/pull/2415)).
- Fixed: `no-extra-semicolons` false positives for comments after custom property sets ([#2396](https://github.com/stylelint/stylelint/pull/2396)).
- Fixed: `value-keyword-case` false positives for `attr`, `counter`, `counters` functions and `counter-reset` property ([#2407](https://github.com/stylelint/stylelint/pull/2407)).
- Fixed: Less mergeable properties are now ignored ([#2570](https://github.com/stylelint/stylelint/pull/2570)).

## 7.9.0

- Added: `ignoreFontFamilyName` option to `font-family-no-duplicate` ([#2314](https://github.com/stylelint/stylelint/pull/2314)).
- Added: `ignorePattern` option to `max-line-length` ([#2333](https://github.com/stylelint/stylelint/pull/2333)).
- Fixed: update version of `lodash` dependency to match feature usage, fixing a conflict with Modernizr ([#2353](https://github.com/stylelint/stylelint/pull/2353)).
- Fixed: `color-hex-case` false positives for ID references in `url` functions ([#2338](https://github.com/stylelint/stylelint/pull/2338)).
- Fixed: `max-line-length` now reports correct column for SCSS comments ([#2340](https://github.com/stylelint/stylelint/pull/2340)).
- Fixed: `selector-class-pattern` false positive in SCSS when combining interpolated and nested selectors ([#2344](https://github.com/stylelint/stylelint/pull/2344)).
- Fixed: `selector-type-case` false positive for placeholder selectors ([#2360](https://github.com/stylelint/stylelint/pull/2360)).

## 7.8.0

- Deprecated: 15 rules ([#2197](https://github.com/stylelint/stylelint/pull/2197), [#2285](https://github.com/stylelint/stylelint/pull/2285) & [#2309](https://github.com/stylelint/stylelint/pull/2309)).
  - `block-no-single-line`. Use `block-opening-brace-newline-after` and `block-closing-brace-newline-before` rules with the option `"always"` instead.
  - `declaration-block-properties-order`. Use the [`stylelint-order`](https://github.com/hudochenkov/stylelint-order) plugin pack instead.
  - `rule-nested-empty-line-before` and `rule-non-nested-empty-line-before`. Use the new `rule-empty-line-before` rule instead.
  - `time-no-imperceptible`. Use the new `time-min-milliseconds` rule with `100` as its primary option.
  - It is beyond the scope of stylelint's core package to effectively validate against the CSS spec. Please investigate [csstree](https://github.com/csstree/csstree) and [css-values](https://github.com/ben-eb/css-values) for this functionality, and contribute to those projects and to stylelint plugins wrapping them. csstree already has a [stylelint plugin](https://github.com/csstree/stylelint-validator), and css-values needs one to be developed. The following rules are deprecated for this reason.
    - `media-feature-no-missing-punctuation`.
    - `selector-no-empty`.
  - A plugin is a better package for a rule that wraps a third-party library. The following rules are deprecated for this reason. We encourage users to create and help maintain plugins for these rules.
    - `no-browser-hacks`
    - `no-indistinguishable-colors`
    - `no-unsupported-browser-features`
  - The following rules did not seem useful. If you liked these rules, please create plugins for them.
    - `custom-property-no-outside-root`
    - `root-no-standard-properties`
    - `selector-root-no-composition`.
  - The following rules did not work well.
    - `stylelint-disable-reason` could not enforce providing a reason.
    - `declaration-block-no-ignored-properties` could not reliably account for _replaced elements_.
- Deprecated: 4 options ([#2213](https://github.com/stylelint/stylelint/pull/2213)).
  - `"all-nested"` option for `at-rule-empty-line-before`. Use the `"inside-block"` option instead.
  - `"blockless-group"` option for `at-rule-empty-line-before`. Use the `"blockless-after-blockless"` option instead.
  - `"between-comments"` option for `comment-empty-line-before`. Use the `"after-comment"` option instead.
  - `"at-rules-without-declaration-blocks"` option for `max-nesting-depth`. Use the `"blockless-at-rules"` option instead.
- Added: `time-min-milliseconds` rule, to replace `time-no-imperceptible` ([#2289](https://github.com/stylelint/stylelint/pull/2289)).
- Added: `except: ["after-same-name"]` option to `at-rule-empty-line-before` ([#2225](https://github.com/stylelint/stylelint/pull/2225)).
- Fixed: `configOverrides` now work with `extends` ([#2295](https://github.com/stylelint/stylelint/pull/2295)).
- Fixed: `max-line-length` no longer reports incorrect column positions for lines with `url()` or `import` ([#2287](https://github.com/stylelint/stylelint/pull/2287)).
- Fixed: `selector-pseudo-class-no-unknown` no longer warns for proprietary webkit pseudo-classes ([#2264](https://github.com/stylelint/stylelint/pull/2264)).
- Fixed: `unit-no-unknown` accepts `fr` units ([#2308](https://github.com/stylelint/stylelint/pull/2308)).

## 7.7.1

- Fixed: ensure only absolute filepaths are passed to processors ([#2207](https://github.com/stylelint/stylelint/pull/2207)).

## 7.7.0

- Added: `stylelint.formatters` exposed in public Node.js API ([#2190](https://github.com/stylelint/stylelint/pull/2190)).
- Added: `stylelint.utils.checkAgainstRule` for checking CSS against a standard stylelint rule _within your own rule_ ([#2173](https://github.com/stylelint/stylelint/pull/2173)).
- Added: `allow-empty-input` flag to CLI ([#2117](https://github.com/stylelint/stylelint/pull/2117)).
- Added: `except: ["after-rule"]` option to `rule-nested-empty-line-before` ([#2188](https://github.com/stylelint/stylelint/pull/2188)).
- Fixed: regression causing `--stdin-filename` in CLI and `codeFilename` in Node.js API to error if a non-existent filename is provided ([#2128](https://github.com/stylelint/stylelint/pull/2128)).
- Fixed: a boolean CLI flag (e.g. `--quiet`) placed before an input glob no longer causes the input to be ignored ([#2186](https://github.com/stylelint/stylelint/pull/2186)).
- Fixed: the `node_modules` and `bower_components` directories are correctly ignored by default when stylelint is used as a PostCSS plugin ([#2171](https://github.com/stylelint/stylelint/pull/2171)).
- Fixed: bug where some Node.js errors in special cases did not cause the CLI to exit with a non-zero code ([#2140](https://github.com/stylelint/stylelint/pull/2140))
- Fixed: false positives related to LESS detached rulesets ([#2089](https://github.com/stylelint/stylelint/pull/2089)).
- Fixed: `color-named` now ignores SCSS maps, so map property names can be color names ([#2182](https://github.com/stylelint/stylelint/pull/2182)).
- Fixed: `comment-whitespace-inside` no longer complains about `/*!` comments with non-space whitespace (e.g. newlines) ([#2121](https://github.com/stylelint/stylelint/pull/2121)).
- Fixed: `media-feature-name-no-vendor-prefix` no longer throws syntax errors on unknown unprefixed variants ([#2152](https://github.com/stylelint/stylelint/pull/2152)).
- Fixed: `selector-max-compound-selectors` ignores SCSS nested declarations ([#2102](https://github.com/stylelint/stylelint/pull/2102)).
- Fixed: `selector-pseudo-class-no-unknown` no longer reports false positives for custom selectors ([#2147](https://github.com/stylelint/stylelint/pull/2147)).

## 7.6.0

- Added: option `customSyntax` (for Node.js API) and `--custom-syntax` (for CLI).
- Added: `font-family-no-duplicate-names` rule.
- Fixed: CLI now understands absolute paths for the `--custom-formatter` option.
- Fixed: the `string` and `verbose` formatters now use `dim` instead of `gray` for greater compatibility with different terminal color schemes.
- Fixed: `media-feature-parentheses-space-inside` handles comments within the parentheses.
- Fixed: `selector-no-qualifying-type` now ignores SCSS `%placeholders`.

## 7.5.0

- Added: `selector-no-empty` rule.
- Fixed: if no config is found relative to the stylesheet, look for one relative to `process.cwd()`.
- Fixed: lookup `ignoreFiles` globs relative to `process.cwd()` if config is directly passed as a JS object and no `configBasedir` is provided.
- Fixed: SugarSS no longer reports wrong column number in `block-no-empty`.
- Fixed: `configOverrides` work with `plugins`, `extends`, and `processors`.
- Fixed: a bug causing inaccuracy in nested `stylelint-disable` and `stylelint-enable` comments.
- Fixed: `function-calc-no-unspaced-operator` false positives for SCSS interpolation.
- Fixed: `no-descending-specificity` now ignores custom property sets.
- Fixed: `value-keyword-case` false positives for some camel-case SVG keywords.

## 7.4.2

- Fixed: regression where using `null` to turn off a rule caused errors.

## 7.4.1

- Fixed: regression where using `null` for rules that take an array for their primary option would trigger a validation warning.

## 7.4.0

- Added: each stylesheet looks up configuration from its own path. Different files can now use different configurations during the same linting process.
- Added: relative path extends, plugins, and processors try to load from `process.cwd()` if they aren't found relative to the invoking configuration.
- Added: `/* stylelint-disable-next-line */` comments.
- Added: `media-feature-name-blacklist` rule.
- Added: `media-feature-name-whitelist` rule.
- Added: `ignore: ["after-declaration"]` option to `declaration-empty-line-before`.
- Added: `except: ["empty"]` option to `function-url-quotes`.
- Fixed: `function-linear-gradient-no-nonstandard-direction` no longer warns when vendor-prefixed linear-gradient properties are used correctly.
- Fixed: `no-extra-semicolons` now ignores the semicolon that comes after the closing brace of a custom property set.
- Fixed: `no-unknown-animations` no longer delivers false positives when there are multiple animation names.
- Fixed: `number-*` rules now ignore numbers in comments and strings.
- Fixed: `value-keyword-case` now ignores system color keywords.

## 7.3.1

- Fixed: regression in 7.3.0 which caused a "Cannot read property 'length' of undefined" error on a certain selector.

## 7.3.0

- Added: `processors` can accept options objects.
- Added: `ignore: ["inside-function"]` option to `color-named`.
- Fixed: `--ignore-path` and `--report-needless-disables` no longer fails when used together.
- Fixed: `block-closing-brace-newline-after` and `block-closing-brace-space-after` now allow a trailing semicolon after the closing brace of a block.
- Fixed: `block-no-single-line` now ignores empty blocks.
- Fixed: `declaration-block-no-ignored-properties` now uses the value of the last occurrence of a triggering property.
- Fixed: `indentation` now correctly handles `_` hacks on property names.
- Fixed: `property-no-unknown` now ignores SCSS nested properties.

## 7.2.0

- Added: `--report-needless-disables` and `reportNeedlessDisables` option.
- Added: `--ignore-disables` and `ignoreDisables` option.
- Added: `--config-basedir` option to CLI.
- Added: `declaration-block-no-redundant-longhand-properties` rule.
- Added: `function-url-scheme-whitelist` rule.
- Added: `media-feature-name-no-unknown` rule.
- Added: `selector-descendant-combinator-no-non-space` rule.
- Added: `value-list-max-empty-lines` rule.
- Added: `ignoreProperties` option to `color-named`.
- Added: `ignore: ["consecutive-duplicates-with-different-values"]` option to `declaration-block-no-duplicate-properties`.
- Added: `ignore: ["comments"]` option to `max-line-length`.
- Added: `ignoreAtRules` option to `max-nesting-depth`.
- Added: `ignoreProperties` option to `unit-blacklist` and `unit-whitelist`
- Fixed: no longer parsing ignored files before ignoring them.
- Fixed: `configFile` and `configBasedir` can now be used together.
- Fixed: `max-line-length` now correctly handles Windows line endings.
- Fixed: `no-descending-specificity` treats selectors with pseudo-elements as distinct from their counterparts without pseudo-classes, because they actually target different elements.
- Fixed: `no-unknown-animations` and `unit-blacklist` now handle numbers without leading zeros.
- Fixed: `root-no-standard-properties` now handles custom property sets.
- Fixed: `selector-no-type` `ignore: ["descendant"]` option now correctly handles descendants within a selector list.
- Fixed: `selector-pseudo-class-no-unknown` now understands the Shadow DOM selectors of `host` and `host-context`.
- Fixed: `selector-pseudo-element-no-unknown` now understands the Shadow DOM selector of `slotted`.

## 7.1.0

- Added: `block-closing-brace-empty-line-before` rule.
- Added: `comment-no-empty` rule.
- Added: `custom-property-empty-line-before` rule.
- Added: `declaration-empty-line-before` rule.
- Added: `media-feature-name-case` rule.
- Added: `selector-nested-pattern` rule.
- Added: `selector-pseudo-class-blacklist` rule.
- Added: `selector-pseudo-class-whitelist` rule.
- Added: regex support to the `ignore*` secondary options of the `*-no-unknown` rules.
- Added: `ignore: ["blockless-after-same-name-blockless"]` option to `at-rule-empty-line-before`.
- Added: `except: ["blockless-after-same-name-blockless"]` option to `at-rule-empty-line-before`.
- Added: `ignore: ["empty-lines"]` option to `no-eol-whitespace`.
- Added: `ignoreTypes` option to `selector-no-type` to whitelist allowed types for selectors.
- Fixed: `color-named` now ignores declarations that accept _custom idents_.
- Fixed: `font-family-name-quotes` correctly handles numerical font weights for the `font` shorthand property.
- Fixed: `indentation` now correctly handles Windows line endings within parentheticals.
- Fixed: `media-feature-no-missing-punctuation` now ignores media features containing complex values e.g. `(min-width: ($var - 20px))` and `(min-width: calc(100% - 20px))`.
- Fixed: `no-descending-specificity` message to correctly show which selector should come first.
- Fixed: `selector-combinator-space-after` and `selector-combinator-space-before` now ignore operators within parenthetical non-standard constructs.

## 7.0.3

- Fixed: bug causing rules in extended configs to be merged with, rather than replaced by, the extending config.
- Fixed: `selector-class-pattern` now ignores fractional keyframes selectors.
- Fixed: `selector-max-specificity` now ignores selectors containing the `matches()` pseudo-class, and warns if the underlying `specificity` module cannot parse the selector.
- Fixed: `selector-no-type` with secondary option `ignore: ["descendant"]` will now resolve nested selectors.

## 7.0.2

- Fixed: `at-rule-blacklist`, `at-rule-whitelist`, `comment-word-blacklist`, `selector-attribute-operator-blacklist`, `selector-attribute-operator-whitelist` now accept array as first option.
- Fixed: `unit-*` rules now ignore CSS hacks.

## 7.0.1

- Fixed: missing `known-css-properties` dependency.

## 7.0.0

- Removed: `--extract` and `extractSyleTagsFromHtml` options. Instead, [build](/docs/developer-guide/processors.md) and [use](/docs/user-guide/configure.md#processors) processors.
- Removed: support for plugin rule names that aren't namespaced, i.e. only `your-namespace/your-rule-name` rule names are supported. (If your plugin provides only a single rule or you can't think of a good namespace, you can simply use `plugin/my-rule`.)
- Removed: `--verbose` CLI flag. Use `--formatter verbose` instead.
- Removed: NodeJS `0.12.x` support. `4.2.1 LTS` or greater is now required.
- Removed: `media-query-parentheses-space-inside` rule. Use the new `media-feature-parentheses-space-inside` rule instead.
- Removed: `no-missing-eof-newline` rule. Use the new rule `no-missing-end-of-source-newline` instead.
- Removed: `number-zero-length-no-unit` rule. Use the `length-zero-no-unit` rule instead.
- Removed: `property-unit-blacklist` rule. Use the `declaration-property-unit-blacklist` rule instead.
- Removed: `property-unit-whitelist` rule. Use the `declaration-property-unit-whitelist` rule instead.
- Removed: `property-value-blacklist` rule. Use the `declaration-property-value-blacklist` rule instead.
- Removed: `property-value-whitelist` rule. Use the `declaration-property-value-whitelist` rule instead.
- Removed: `"emptyLineBefore"` option for `declaration-block-properties-order`. If you use this option, please consider creating a plugin for the community.
- Removed: `"single-where-required"`, `"single-where-recommended"`, `"single-unless-keyword"`, `"double-where-required"`, `"double-where-recommended"` and `"double-unless-keyword"` options for `font-family-name-quotes`. Instead, use the `"always-unless-keyword"`, `always-where-recommended` or `always-where-required` options together with the `string-quotes` rule.
- Removed: `"single"`, `"double"` and `"none"` options for `function-url-quotes`. Instead, use the `"always"` or `"never"` options together with the `string-quotes` rule.
- Removed: `"hierarchicalSelectors"` option for `indentation`. If you use this option, please consider creating a plugin for the community.
- Removed: `stylelint.utils.cssWordIsVariable()`.
- Removed: `stylelint.utils.styleSearch()`. Use the external [style-search](https://github.com/davidtheclark/style-search) module instead.
- Changed: invalid configuration sets result's `stylelintError` to `true`, which in turn causes CLI to exit with a non-zero code.
- Changed: non-standard syntaxes are automatically inferred from file extensions `.scss`, `.less`, and `.sss`.
- Changed: `.stylelintignore` now uses `.gitignore` syntax, and stylelint looks for it in `process.cwd()`.
- Changed: files matching ignore patterns no longer receive an "info"-severity message, which was always printed by the string formatter. Instead, the file's stylelint result object receives an `ignored: true` property, which various formatters can use as needed. The standard `string` formatter prints nothing for ignored files; but when the `verbose` formatter is used, ignored files are included in the filelist.
- Changed: plugin arrays in extended configs are now concatenated with the main config's plugin array, instead of being overwritten by it. So plugins from the main config and from extended configs will all be loaded.
- Changed: `-v` flag to display version number.
- Changed: `comment-word-blacklist` no longer ignores words within copyright comments.
- Changed: `comment-word-blacklist` will now identify strings within comments, rather than just at the beginning of, when the string option is used.
- Changed: `declaration-block-no-ignored-properties` now detects use of `min-width` and `max-width` with `inline`, `table-row`, `table-row-group`, `table-column` and `table-column-group` elements.
- Changed: `declaration-block-no-ignored-properties` now detects use of `overflow`, `overflow-x` and `overflow-y` with `inline` elements.
- Changed: `declaration-block-no-ignored-properties` now ignores the combination of `float` and `display: inline-block | inline`.
- Changed: `font-family-name-quotes` now checks the `font` property in addition to the `font-family` property.
- Changed: `font-family-name-quotes` treats `-apple-*` and `BlinkMacSystemFont` system fonts as keywords that should never be wrapped in quotes.
- Changed: `indentation` now checks inside of parentheses by default. If you use the `indentInsideParens: "once"` secondary option, simply remove it from your config. If you do not want to check inside of parentheses, use the new `ignore: ["inside-parens"]` secondary option. The `indentInsideParens: "twice"` and `indentInsideParens: "once-at-root-twice-in-block"` secondary options are unchanged.
- Changed: `keyframe-declaration-no-important` now checks vendor prefixed `@keyframes` at-rules.
- Changed: `selector-attribute-quotes` now checks attribute selectors with whitespace around the operator or inside the brackets.
- Changed: `time-no-imperceptible` now checks vendor prefixed properties.
- Changed: `unit-*` rules now check `@media` values too.
- Added: plugins can allow primary option arrays by setting `ruleFunction.primaryOptionArray = true`.
- Added: [processors](/docs/user-guide/configure.md#processors).
- Added: `media-feature-parentheses-space-inside` rule.
- Added: `no-missing-end-of-source-newline` rule.
- Added: `property-no-unknown` rule.
- Fixed: Better handling quotes in selector attribute with multiple attributes.
- Fixed: `no-unknown-animations` now classifies vendor prefixed `@keyframes` at-rules as known.

## 6.9.0

- Added: `defaultSeverity` configuration option.
- Added: invoking the CLI with no arguments and no stdin (i.e. just `stylelint`) is equivalent to `stylelint --help`.
- Added: `function-url-no-scheme-relative` rule.
- Added: `selector-attribute-quotes` rule.
- Fixed: the CLI now uses `process.exitCode` with `stdOut` to allow the process to exit naturally and avoid truncating output.
- Fixed: `function-calc-no-unspaced-operator` correctly interprets negative fractional numbers without leading zeros and those wrapped in parentheses.
- Fixed: `no-extra-semicolons` now ignores semicolons after Less mixins.
- Fixed: `number-max-precision` now ignores uppercase and mixed case `@import` at-rules.
- Fixed: `selector-max-specificity` no longer crashes on selectors containing `:not()` pseudo-classes.
- Fixed: `time-no-imperceptible` correctly handles negative time.

## 6.8.0

- Deprecated: `-e` and `--extract` CLI flags, and the `extractStyleTagsFromHtml` Node.js API option. If you use these flags or option, please consider creating a processor for the community.
- Added: `at-rule-no-unknown` rule.
- Added: `no-empty-source` rule.
- Added: `except: ["after-single-line-comment"]` option for `rule-non-nested-empty-line-before`.
- Added: `ignoreProperties: []` option for `declaration-block-no-duplicate-properties`.
- Fixed: accuracy of warning positions for empty blocks when using SugarSS parser.

## 6.7.1

- Fixed: `block-*-brace-*-before` CRLF (`\r\n`) warning positioning.
- Fixed: `no-descending-specificity` now does comparison of specificity using ints, rather than strings.
- Fixed: `selector-no-type` and `selector-type-case` now ignore non-standard keyframe selectors (e.g. within an SCSS mixin).
- Fixed: `selector-type-no-unknown` no longer reports fractional keyframe selectors.

## 6.7.0

- Added: `ignoreFunctions: []` option for `function-name-case`.
- Fixed: rules using `findFontFamily` util correctly interpret `<font-size>/<line-height>` values with unitless line-heights.
- Fixed: `indentation` better understands nested parentheticals that aren't just Sass maps and lists.
- Fixed: `no-unsupported-browser-features` message now clearly states that only _fully_ supported features are allowed.
- Fixed: `selector-max-specificity` no longer reports that a selector with 11 elements or more has a higher specificity than a selector with a single classname.
- Fixed: `selector-type-no-unknown` no longer warns for complex keyframe selectors.

## 6.6.0

- Deprecated: `number-zero-length-no-unit`. Use `length-zero-no-unit` instead.
- Deprecated: `property-*-blacklist` and `property-*-whitelist`. Use `declaration-property-*-blacklist` and `declaration-property-*-whitelist` instead.
- Deprecated: `-v` and `--verbose` CLI flags. Use `-f verbose` or `--formatter verbose` instead.
- Deprecated: `stylelint.util.styleSearch()`. Use the external module [style-search](https://github.com/davidtheclark/style-search) instead.
- Added: option `ignorePath` (for JS) and `--ignore-path` (for CLI).
- Added: `-h` alias for `--help` CLI flag.
- Added: `at-rule-blacklist` rule.
- Added: `at-rule-name-newline-after` rule.
- Added: `at-rule-whitelist` rule.
- Added: `ignore: "blockless-group"` option for `at-rule-empty-line-before`.
- Added: `ignoreAtRules: []` option for `at-rule-empty-line-before`.
- Added: `function-blacklist` now accepts regular expressions.
- Added: `function-whitelist` now accepts regular expressions.
- Fixed: crash when tty columns is reported as zero, which happened when running stylelint on Travis CI in OSX.
- Fixed: selector-targeting rules ignore Less mixins and extends.
- Fixed: `at-rule-name-newline-after` now correctly accepts one _or more_ newlines.
- Fixed: `declaration-block-semicolon-newline-before` now correctly accepts one _or more_ newlines.
- Fixed: `function-url-quotes` ignores values containing `$sass` and `@less` variables.
- Fixed: `function-whitespace-after` ignores `postcss-simple-vars`-style interpolation.
- Fixed: `indentation` better understands nested parentheticals, like nested Sass maps.
- Fixed: `no-extra-semicolons` reports errors on the correct line.
- Fixed: `selector-combinator-space-*` rules now ignore escaped combinator-like characters.
- Fixed: `selector-type-no-unknown` ignores non-standard usage of percentage keyframe selectors (e.g. within an SCSS mixin).
- Fixed: `value-keyword-case` now ignores custom idents of properties `animation`, `font`, `list-style`.

## 6.5.1

- Deprecated: `"emptyLineBefore"` option for `declaration-block-properties-order`. If you use this option, please consider creating a plugin for the community.
- Deprecated: `"single-where-required"`, `"single-where-recommended"`, `"single-unless-keyword"`, `"double-where-required"`, `"double-where-recommended"` and `"double-unless-keyword"` options for `font-family-name-quotes`. Instead, use the `"always-unless-keyword"`, `always-where-recommended` or `always-where-required` options together with the `string-quotes` rule.
- Deprecated: `"single"`, `"double"` and `"none"` options for `function-url-quotes`. Instead, use the `"always"` or `"never"` options together with the `string-quotes` rule.
- Deprecated: `"hierarchicalSelectors"` option for `indentation`. If you use this option, please consider creating a plugin for the community.
- Fixed: the string formatter no longer errors on non-rule errors.
- Fixed: `selector-list-comma-*` rules now ignore Less mixins.
- Fixed: `selector-max-compound-selectors` no longer errors on Less mixins.
- Fixed: `selector-type-no-unknown` now ignores all _An+B notation_ and linguistic pseudo-classes.
- Fixed: `selector-type-no-unknown` now ignores obsolete HTML tags and `<hgroup>`.

## 6.5.0

- Added: `selector-max-compound-selectors` rule.
- Fixed: `babel-polyfill` removed so it doesn't clash with other processes using `babel-polyfill`.
- Fixed: `selector-type-case` and `selector-type-no-unknown` rules now ignore SCSS placeholder selectors.

## 6.4.2

- Fixed: `selector-pseudo-class-case`, `selector-pseudo-class-no-unknown`, `selector-pseudo-element-case`, `selector-pseudo-element-no-unknown` rules now ignore SCSS variable interpolation.
- Fixed: `selector-type-no-unknown` now ignores nested selectors and keyframe selectors.

## 6.4.1

- Fixed: `shorthand-property-no-redundant-values` now ignores `background`, `font`, `border`, `border-top`, `border-bottom`, `border-left`, `border-right`, `list-style`, `transition` properties.
- Fixed: `unit-no-unknown` now ignores hex colors.

## 6.4.0

- Added: `keyframe-declaration-no-important` rule.
- Added: `selector-attribute-operator-blacklist` rule.
- Added: `selector-attribute-operator-whitelist` rule.
- Added: `selector-pseudo-class-no-unknown` rule.
- Added: `selector-type-no-unknown` rule.
- Fixed: string formatter no longer errors on multi-byte `message`.
- Fixed: catch errors thrown by `postcss-selector-parser` and register them as PostCSS warnings, providing a better UX for editor plugins.
- Fixed: some rules now better handle case insensitive CSS identifiers.
- Fixed: `font-family-name-quotes`, `media-feature-no-missing-punctuation`, `media-query-list-comma-newline-after`, `media-query-list-comma-newline-before`, `media-query-list-comma-space-after` and `media-query-list-comma-space-before` rules now better ignore SCSS, Less variables and nonstandard at-rules.
- Fixed: `no-unknown-animations` now ignores `ease` value.
- Fixed: `unit-blacklist`, `unit-case`, `unit-no-unknown`, `unit-whitelist` now better accounts interpolation.
- Fixed: `unit-no-unknown` no longer breaks Node.js 0.12 (because we've included the Babel polyfill).
- Fixed: `value-keyword-case` now ignores custom idents of properties `animation-name`, `counter-increment`, `font-family`, `grid-row`, `grid-column`, `grid-area`, `list-style-type`.
- Fixed: wrong example for `always-multi-line` in rule `block-opening-brace-newline-before` documentation.

## 6.3.3

- Fixed: `block-closing-brace-newline-before` no longer delivers false positives for extra semicolon.
- Fixed: `declaration-block-no-ignored-properties` now detects use of `vertical-align` with block-level elements.
- Fixed: `font-family-name-quotes` is now case insensitive when hunting for font-family properties.
- Fixed: `number-zero-length-no-unit` now ignores `deg`, `grad`, `turn` and `rad` units.
- Fixed: `selector-no-type` does a better job when ignoring descendant and compound selectors.

## 6.3.2

- Fixed: `shorthand-property-no-redundant-values` now handles uppercase values properly.

## 6.3.1

- Fixed: `declaration-block-no-ignored-properties` now longer crashes on nested rules.

## 6.3.0

- Deprecated: support for plugin rule names that aren't namespaced i.e. only `your-namespace/your-rule-name` rule names are supported. If your plugin provides only a single rule or you can't think of a good namespace, you can simply use `plugin/my-rule`).
- Added: support for plugins that provides an array of rules.
- Added: support for extracting and linting CSS from within HTML sources.
- Added: `--stdin-filename` option to CLI.
- Added: `at-rule-name-space-after` rule.
- Added: `no-extra-semicolons` rule.
- Added: `selector-attribute-operator-space-after` rule.
- Added: `selector-attribute-operator-space-before` rule.
- Added: `selector-max-empty-lines` rule.
- Added: `selector-pseudo-element-no-unknown` rule.
- Added: flexible support for end-of-line comments in `at-rule-semicolon-newline-after`, `block-opening-brace-newline-after`, and `declaration-block-semicolon-newline-after`.
- Fixed: string and verbose formatters no longer use an ambiguous colour schemes.
- Fixed: string formatter no longer outputs an empty line if there are no problems.
- Fixed: all rules now handle case insensitive CSS identifiers.
- Fixed: `function-comma-newline-after` now allows end-of-line comments.
- Fixed: `function-url-quotes` now ignores spaces within `url()`.
- Fixed: `no-descending-specificity` now ignores trailing colons within selectors.
- Fixed: `no-indistinguishable-colors` now ignores keyword color names within `url()`.
- Fixed: `number-max-precision` now ignores `@import` at-rules and `url()` functions.
- Fixed: `selector-class-pattern` and `selector-id-pattern` rules now ignore SCSS variable interpolation.
- Fixed: `value-list-comma-*` rules now ignore SCSS maps.

## 6.2.2

- Deprecated: `stylelint.utils.cssWordIsVariable()` as non-standard syntax utils are now defensive.
- Fixed: `declaration-colon-*` rules now ignore SCSS lists.
- Fixed: `font-weight-notation` now ignores SCSS interpolation.
- Fixed: `rule-nested-empty-line-before` now ignores Less blockless rules (mixin and extend calls).

## 6.2.1

- Fixed: more problems with exposed `stylelint.createRuleTester`.

## 6.2.0

- Added: `selector-no-qualifying-type` rule.
- Fixed: `number-leading-zero` will not check `@import` at-rules.
- Fixed: `selector-class-pattern` now ignores non-outputting Less mixin definitions and called Less mixins.
- Fixed: `value-keyword-case` now accounts for camelCase keywords (e.g. `optimizeSpeed`, `optimizeLegibility` and `geometricPrecision`) when the `lower` option is used.
- Fixed: `testUtils` and `stylelint.createRuleTester` module mistakes.

## 6.1.1

- Fixed: documentation links to `selector-pseudo-class-parentheses-space-inside` and `selector-attribute-brackets-space-inside`.

## 6.1.0

- Added: support for `.stylelintignore` file.
- Added: warning message in output when a file is ignored.
- Added: `comment-word-blacklist` rule.
- Added: `selector-attribute-brackets-space-inside` rule.
- Added: `selector-pseudo-class-parentheses-space-inside` rule.
- Added: `shorthand-property-no-redundant-values` rule.
- Added: `ignoreKeywords` option for `value-keyword-case`.
- Fixed: CRLF (`\r\n`) warning positioning in `string-no-newline`.
- Fixed: parsing problems when using `///`-SassDoc-style comments.
- Fixed: `max-empty-lines` places warning at the end of the violating newlines to avoid positioning confusions.

## 6.0.3

- Fixed: CRLF (`\r\n`) warning positioning in `max-empty-lines` and `function-max-empty-lines`.

## 6.0.2

- Fixed: `CssSyntaxError` sets `errored` on output to `true`.

## 6.0.1

- Fixed: `function-name-case` now accounts for camelCase function names (e.g. `translateX`, `scaleX` etc) when the `lower` option is used.

## 6.0.0

- Changed: `CssSyntaxError` is no longer thrown but reported alongside warnings.
- Added: new look for standard formatter and support for arbitrary severity names.
- Added: exposed `stylelint.utils.cssWordIsVariable()`.
- Added: `at-rule-name-case` rule.
- Added: `function-name-case` rule.
- Added: `property-case` rule.
- Added: `selector-pseudo-class-case` rule.
- Added: `selector-pseudo-element-case` rule.
- Added: `unit-case` rule.
- Added: `value-keyword-case` rule.
- Added: `indentClosingBrace` option to `indentation`.
- Added: `indentInsideParens` option to `indentation`.
- Added: `consecutive-duplicates` option for `declaration-block-no-duplicate-properties` rule.
- Fixed: `block-no-empty` no longer delivers false positives for less syntax.
- Fixed: `declaration-block-trailing-semicolon` better understands nested at-rules.
- Fixed: `number-zero-length-no-unit` now work with `q` unit and ignores `s`, `ms`, `kHz`, `Hz`, `dpcm`, `dppx`, `dpi` units

## 5.4.0

- Added: `unit-no-unknown` rule.
- Fixed: `no-descending-specificity` no longer gets confused when the last part of a selector is a compound selector.
- Fixed: regression causing `indentation` to complain about Sass maps.
- Fixed: `declaration-block-no-ignored-properties` now ignore `clear` for `position: absolute` and `position: relative` and does not ignore `float` on `display: table-*`.

## 5.3.0

- Added: (experimental) support for [Less](http://lesscss.org/) syntax.
- Added: support for [SugarSS](https://github.com/postcss/sugarss) syntax.
- Added: exposed `stylelint.createRuleTester()`.
- Added: `declaration-block-no-ignored-properties` rule.
- Added: `function-max-empty-lines` rule.
- Added: `function-url-data-uris` rule.
- Fixed: `block-closing-brace-newline-after` accepts single-line comments immediately after the closing brace.
- Fixed: `block-closing-brace-newline-after` use of "single space", rather than "newline", in its messages.
- Fixed: `font-weight-notation` now ignores `initial` value.
- Fixed: `function-*` rules should all now ignore all Sass maps and lists.
- Fixed: `function-calc-no-unspaced-operator` accepts newlines.
- Fixed: `function-comma-space-after`, `function-comma-space-before`, `function-parentheses-newline-inside` and `function-parentheses-space-inside` now ignore SCSS maps.
- Fixed: `max-line-length` options validation.
- Fixed: `no-unknown-animations` now ignores `none`, `initial`, `inherit`, `unset` values.
- Fixed: `property-value-blacklist` and `-whitelist` no longer error on properties without a corresponding list entry.
- Fixed: `selector-class-pattern` now ignores selectors with Sass interpolation.
- Fixed: `selector-id-pattern` now ignores selectors with Sass interpolation.
- Fixed: `selector-no-id` now ignores keyframe selectors.
- Fixed: `unit-blacklist` and `unit-whitelist` now ignores `url` functions.

## 5.2.1

- Fixed: `function-calc-no-unspaced-operator` now better ignores non-`calc` functions.
- Fixed: `no-descending-specificity` no longer delivers false positives after second run in Atom linter.
- Fixed: `stylelint-disable-rule` imported correctly.

## 5.2.0

- Added: `at-rule-semicolon-newline-after` rule.
- Added: `no-indistinguishable-colors` rule.
- Added: `stylelint-disable-reason` rule.
- Fixed: `declaration-bang-space-*` understands arbitrary bang declarations (e.g. `!default`).
- Fixed: `font-weight-notation` now ignore `inherit` value.
- Fixed: `indentation` treats `@nest` at-rules like regular rules with selectors.
- Fixed: `no-duplicate-selectors` contextualizes selectors by all at-rules, not just media queries.
- Fixed: `no-duplicate-selectors` no longer delivers false positives after second run in Atom linter.
- Fixed: `no-duplicate-selectors` no longer delivers false positives with descendant combinators.
- Fixed: `number-no-trailing-zeros` no longer delivers false positives in `url()` arguments.
- Fixed: `root-no-standard-properties` no longer delivers false positives inside the `:not()` pseudo-selector.
- Fixed: `selector-list-comma-*` rules no longer deliver false positives inside functional notation.

## 5.1.0

- Added: `selector-type-case` rule.
- Fixed: no more subtle configuration bug when using extends and plugins together in tangled ways.

## 5.0.1

- Fixed: `string-no-newline` no longer stumbles when there are comment-starting characters inside strings.

## 5.0.0

- Removed: `no-indistinguishable-colors` because its dependencies were unusable in Atom. (To be re-evaluated and re-added later.)
- Removed: `"warn": true` secondary option. Use `"severity": "warning"`, instead.
- Removed: `color-no-named` rule. Use the new `color-named` rule, with the `"never"` option instead.
- Removed: `declaration-block-no-single-line` rule. Use the new `block-no-single-line` rule instead.
- Removed: `rule-no-duplicate-properties` rule. Use the new `declaration-block-no-duplicate-properties` rule instead.
- Removed: `rule-no-shorthand-property-overrides` rule. Use the new `declaration-block-no-shorthand-property-overrides` rule instead.
- Removed: `rule-properties-order` rule. Use the new `declaration-block-properties-order` rule instead.
- Removed: `rule-trailing-semicolon` rule. Use the new `declaration-block-trailing-semicolon` rule instead.
- Removed `true` option for `emptyLineBefore` when using property groups in `rule-properties-order`. Use the new `"always"` or `"never"` option instead.
- Removed: `"always"` option for `font-weight-notation`. Use the new `always-where-possible` option instead.
- Added: support for overlapping `stylelint-disable` commands.
- Fixed: `max-nesting-depth` does not warn about blockless at-rules.
- Fixed: `function-comma-newline-after` and related rules consider input to be multi-line (applying to "always-multi-line", etc.) when the newlines are at the beginning or end of the input.
- Fixed: `no-indistinguishable-colors` no longer errors on color functions containing spaces e.g. `rgb(0, 0, 0)` -- but also removed the rule (see above).
- Fixed: `declaration-block-properties-order` no longer fails when an unspecified property comes before or after a specified property in a group with `emptyLineBefore: true`.
- Fixed: `indentation` no longer has false positives when there are empty lines within multi-line values.
- Fixed: `declaration-colon-*-after` no longer fail to do their job when you want a space or newline after the colon and instead there is no space at all.

## 4.5.1

- Fixed: `no-unsupported-browser-features` options now optional.
- Fixed: `no-duplicate-selectors` now ignores keyframe selectors.

## 4.5.0

- Deprecated: `"warn": true` secondary option. Use `"severity": "warning"`, instead.
- Deprecated: `color-no-named` rule. Use the new `color-named` rule, with the `"never"` option instead.
- Deprecated: `declaration-block-no-single-line` rule. Use the new `block-no-single-line` rule instead.
- Deprecated: `rule-no-duplicate-properties` rule. Use the new `declaration-block-no-duplicate-properties` rule instead.
- Deprecated: `rule-no-shorthand-property-overrides` rule. Use the new `declaration-block-no-shorthand-property-overrides` rule instead.
- Deprecated: `rule-properties-order` rule. Use the new `declaration-block-properties-order` rule instead.
- Deprecated: `rule-trailing-semicolon` rule. Use the new `declaration-block-trailing-semicolon` rule instead.
- Deprecated `true` option for `emptyLineBefore` when using property groups in `rule-properties-order`. Use the new `"always"` or `"never"` option instead.
- Deprecated: `"always"` option for `font-weight-notation`. Use the new `always-where-possible` option instead.
- Added: universal `severity` secondary option as a replacement for `"warn": true` to alter a rule's severity.
- Added: `block-no-single-line` rule.
- Added: `color-named` rule.
- Added: `declaration-block-no-duplicate-properties` rule.
- Added: `declaration-block-no-shorthand-property-overrides` rule.
- Added: `declaration-block-properties-order` rule.
- Added: `declaration-block-trailing-semicolon` rule.
- Added: `max-nesting-depth` rule.
- Added: `no-browser-hacks` rule.
- Added: `no-descending-specificity` rule.
- Added: `no-indistinguishable-colors` rule.
- Added: `no-unsupported-browser-features` rule.
- Added: `selector-max-specificity` rule.
- Added: `string-no-newline` rule.
- Added: `"always"` and `"never"` option to `rule-properties-order` `emptyLineBefore` when using property groups
- Added: `named-where-possible` option to `font-weight-notation`.
- Added: `unspecified: "bottomAlphabetical"` option to the `rule-properties-order` rule.
- Added: `ignoreAtRules: []` option to the `block-opening-brace-space-before` and `block-closing-brace-newline-after` rules.
- Added: support for using the nesting selector (`&`) as a prefix in `selector-no-type`.
- Added: `stylelint-disable-line` feature.
- Added: `withinComments`, `withinStrings`, and `checkStrings` options to `styleSearch`, and `insideString` property to the `styleSearch` match object.
- Added: `resolveNestedSelectors` option to the `selector-class-pattern` rule.
- Fixed: informative errors are thrown when `stylelint-disable` is misused.
- Fixed: `selector-no-vendor-prefix` no longer delivers two warnings on vendor-prefixed pseudo-elements with two colons, e.g. `::-moz-placeholder`.
- Fixed: `no-duplicate-selectors` rule now resolves nested selectors.
- Fixed: `font-weight-notation` does not throw false warnings when `normal` is used in certain ways.
- Fixed: `selector-no-*` and `selector-*-pattern` rules now ignore custom property sets.
- Fixed: nested selector handling for `no-duplicate-selectors`.
- Fixed: `selector-no-id` does not warn about Sass interpolation inside an `:nth-child()` argument.
- Fixed: handling of mixed line endings in `rule-nested-empty-line-before`, `rule-non-nested-empty-line-before`, `comment-empty-line-before` and `at-rule-empty-line-before`.
- Fixed: `number-leading-zero`, `function-comma-space-*`, and `declaration-colon-*` do not throw false positives in `url()` arguments.

## 4.4.0

- Added: `ignore: "relative"` option for `font-weight-notation`.
- Fixed: `declaration-colon-space/newline-before/after` rules now ignore scss maps.
- Fixed: `selector-list-comma-newline-after` allows `//` comments after the comma.

## 4.3.6

- Fixed: removed `console.log()`s in `property-unit-whitelist`.

## 4.3.5

- Fixed: removed `console.log()`s in `rule-properties-order`.

## 4.3.4

- Fixed: option normalization for rules with primary options that are arrays of objects, like `rule-properties-order`.
- Fixed: accuracy of warning positions are `//` comments when using SCSS parser.
- Fixed: `no-unknown-animations` ignores variables.
- Fixed: `no-unknown-animations` does not erroneously flag functions like `steps()` and `cubic-bezier()`.
- Fixed: clarified error message in `time-no-imperceptible`.
- Fixed: `font-family-name-quotes` and `font-weight-notation` ignore variables.
- Fixed: `media-feature-no-missing-punctuation` handles space-padded media features.
- Fixed: regression causing CLI `--config` relatives paths that don't start with `./` to be rejected.

## 4.3.3

- Fixed: again removed `stylelint.utils.ruleTester` because its dependencies broke things.

## 4.3.2

- Fixed: move `tape` to dependencies to support `testUtils`.

## 4.3.1

- Fixed: include `testUtils` in npm package whitelist.

## 4.3.0

- Added: `font-family-name-quotes` rule.
- Added: `font-weight-notation` rule.
- Added: `media-feature-no-missing-punctuation` rule.
- Added: `no-duplicate-selectors` rule.
- Added: `no-invalid-double-slash-comments` rule.
- Added: `no-unknown-animations` rule.
- Added: `property-value-blacklist` rule.
- Added: `property-value-whitelist` rule.
- Added: `time-no-imperceptible` rule.
- Added: `ignore: "descendant"` and `ignore: "compounded"` options for `selector-no-type`.
- Added: support for regular expression property identification in `property-blacklist`, `property-unit-blacklist`, `property-unit-whitelist`, `property-value-blacklist`, and `property-whitelist`.
- Added: better handling of vendor prefixes in `property-unit-blacklist` and `property-unit-whitelist`, e.g. if you enter `animation` it now also checks `-webkit-animation`.
- Added: support for using names of modules for the CLI's `--config` argument, not just paths.
- Added: `codeFilename` option to Node.js API.
- Added: exposed rules at `stylelint.rules` to make stylelint even more extensible.
- Added: brought `stylelint-rule-tester` into this repo, and exposed it at `stylelint.utils.ruleTester`.
- Fixed: bug in `rule-properties-order` empty line detection when the two newlines were separated
  by some other whitespace.
- Fixed: option parsing bug that caused problems when using the `"alphabetical"` primary option
  with `rule-properties-order`.
- Fixed: regard an empty string as a valid CSS code.
- Fixed: `ignoreFiles` handling of absolute paths.
- Fixed: `ignoreFiles` uses the `configBasedir` option to interpret relative paths.

## 4.2.0

- Added: support for custom messages with a `message` secondary property on any rule.
- Fixed: CLI always ignores contents of `node_modules` and `bower_components` directories.
- Fixed: bug preventing CLI from understanding absolute paths in `--config` argument.
- Fixed: bug causing `indentation` to stumble over declarations with semicolons on their own lines.

## 4.1.0

- Added: helpful option validation message when object is expected but non-object provided.
- Fixed: `selector-no-id` no longer warns about Sass interpolation when multiple interpolations are used in a selector.

## 4.0.0

- Removed: support for legacy numbered severities.
- Added: support for extensions on `.stylelintrc` files (by upgrading cosmiconfig).
- Added: `ignore: "non-comments"` option to `max-line-length`.
- Fixed: `function-whitespace-after` does not expect space between `)` and `}`, so it handles Sass interpolation better.

## 3.2.3

- Fixed: `selector-no-vendor-prefix` now handles custom-property-sets.

## 3.2.2

- Fixed: `selector-no-type` ignores `nth-child` pseudo-classes and `@keyframes` selectors.

## 3.2.1

- Fixed: `max-line-length` handles `url()` functions better.
- Fixed: `block-opening-brace-newline-after` and `declaration-block-semicolon-newline-after` handle end-of-line comments better.

## 3.2.0

- Added: `legacyNumberedSeverities` config property to force the legacy severity system.
- Added: `selector-no-id` ignores Sass-style interpolation.
- Fixed: bug causing extended config to override the config that extends it.

## 3.1.4

- Fixed: stopped hijacking `--config` property in PostCSS and Node.js APIs. Still using it in the CLI.

## 3.1.3

- Fixed: bug preventing the disabling of rules analyzing the `root` node, including: `max-line-length`, `max-empty-lines`, `no-eol-whitespace`, `no-missing-eof-newline`, and `string-quotes`.
- Fixed: bug causing `rule-properties-order` to get confused by properties with an unspecified order.

## 3.1.2

- Fixed: bug causing an error when `null` was used on rules whose primary options are arrays.

## 3.1.1

- Fixed: Documentation improvements.

## 3.1.0

- Added: `stylelint-commands` `ignore` option to `comment-empty-line-before`.
- Fixed: v3 regression causing bug in `rule-properties-order` and potentially other rules that accept arrays as primary options.
- Fixed: `no-missing-eof-newline` no longer complains about completely empty files.

## 3.0.3

- Fixed: list of rules within documentation.

## 3.0.0-3.0.2

- Removed: `nesting-block-opening-brace-space-before` and `nesting-block-opening-brace-newline-before` rules.
- Deprecated: numbered severities (0, 1, 2) and will be disabled in `4.0`.
- Changed: renamed `rule-single-line-max-declarations` to `declaration-block-single-line-max-declarations` and changed scope of the single-line to the declaration block.
- Changed: renamed `rule-no-single-line` to `declaration-block-no-single-line` and changed scope of the single-line to the declaration block.
- Changed: renamed the `function-space-after` rule to `function-whitespace-after`.
- Changed: renamed the `comment-space-inside` rule to `comment-whitespace-inside`.
- Changed: renamed the `no-multiple-empty-lines` rule to `max-empty-lines` (takes an `int` as option).
- Changed: `plugins` is now an array instead of an object. And plugins should be created with `stylelint.createPlugin()`.
- Added: cosmiconfig, which means the following:
  - support for YAML `.stylelintrc`
  - support for `stylelint.config.js`
  - support for `stylelint` property in `package.json`
  - alternate config loading system, which stops at the first config found
- Added: asynchronicity to the PostCSS plugin.
- Added: `ignoreFiles` option to config.
- Added: `configFile` option to Node.js API.
- Fixed: `comment-whitespace-inside` now ignores copyright (`/*!`) and sourcemap (`/*#`) comments.
- Fixed: `rule-no-duplicate-properties` now ignores the `src` property.

## 2.3.7

- Fixed: `function-calc-no-unspaced-operator` ignores characters in `$sass` and `@less` variables.
- Fixed: `rule-properties-order` allows comments at the top of groups that expect newlines before them.
- Fixed: `styleSearch()` and the rules it powers will not trip up on single-line (`//`) comments.
- Fixed: `selector-combinator-space-before` now better handles nested selectors starting with combinators.
- Fixed: `rule-properties-order` now deals property with `-moz-osx-font-smoothing`.

## 2.3.6

- Fixed: improved documentation of CLI globbing possibilities.
- Fixed: `rule-properties-order` now accounts for property names containing multiple hyphens.
- Fixed: `rule-properties-order` grouping bug.

## 2.3.5

- Added: error about undefined severities blaming stylelint for the bug.
- Fixed: `selector-pseudo-element-colon-notation` typo in rule name resulting in undefined severity.

## 2.3.4

- Fixed: `dist/` build.

## 2.3.3

- Fixed: `property-whitelist`, `rule-no-duplicate-properties`, and `rule-properties-order` ignore variables (`$sass`, `@less`, and `--custom-property`).
- Fixed: `root-no-standard-properties` ignores `$sass` and `@less` variables.
- Fixed: `comment-empty-line-before` and `comment-space-inside` no longer complain about `//` comments.

## 2.3.2

- Fixed: `number-no-trailing-zeros` no longer flags at-import at-rules.

## 2.3.1

- Fixed: `selector-no-type` no longer flags the _nesting selector_ (`&`).

## 2.3.0

- Added: `configFile` option to PostCSS plugin.
- Fixed: `function-parentheses-newline-inside` and `function-parentheses-space-inside` bug with nested functions.

## 2.2.0

- Added: `selector-class-pattern` rule.
- Added: `selector-id-pattern` rule.
- Added: `function-parentheses-newline-inside` rule.
- Added: `"always-single-line"` and `"never-single-line"` options to `function-parentheses-space-inside`.
- Fixed: CLI `syntax` argument bug.

## 2.1.0

- Added: `color-no-hex` rule.
- Added: `color-no-named` rule.
- Added: `function-blacklist` rule.
- Added: `function-whitelist` rule.
- Added: `unit-blacklist` rule.
- Added: `unit-whitelist` rule.
- Added: `property-unit-blacklist` rule.
- Added: `property-unit-whitelist` rule.
- Added: `rule-single-line-max-declarations` rule.
- Added: `max-line-length` rule.
- Added: `first-nested` exception to `comment-empty-line-before`.
- Added: single value options to `*-blacklist` & `-*whitelist` rules e.g. `{ "function-blacklist": "calc"}`
- Added: support for flexible groups to `rule-properties-order`.
- Added: support for an optional empty line between each group to `rule-properties-order`.
- Added: support for mathematical signs in front of Sass and Less variables in `function-calc-no-unspaced-operator`.
- Added: support for arbitrary whitespace after function in `function-space-after`.
- Added: support for arbitrary whitespace at the edge of comments in `comment-space-inside`.
- Fixed: `comment-space-inside` allows any number of asterisks at the beginning and end of comments.
- Fixed: bug causing `{ unspecified: "bottom }"` option not to be applied within `rule-properties-order`.
- Fixed: bug causing `function-comma-*` whitespace rules to improperly judge whether to enforce single- or multi-line options.
- Fixed: bug when loading plugins from an extended config
- Fixed: indentation for function arguments, by ignoring them.

## 2.0.0

- Changed: plugins are now included and configured via a "locator", rather than either being `required` or being inserted directly into the configuration object as a function.
- Added: CLI.
- Added: standalone Node.js API.
- Added: quiet mode to CLI and Node.js API.
- Added: support for formatters, including custom ones, to CLI and Node.js API.
- Added: `string` and `json` formatters.
- Added: support for using `.stylelintrc` JSON file.
- Added: support for extending existing configs using the `extends` property.
- Added: support for SCSS syntax parsing to CLI and Node.js API.
- Added: `function-comma-newline-after` rule.
- Added: `function-comma-newline-before` rule.
- Added: `"always-single-line"` and `"never-single-line"` options to `function-comma-space-after` rule.
- Added: `"always-single-line"` and `"never-single-line"` options to `function-comma-space-before` rule.

## 1.2.1

- Fixed: the `media-query-list-comma-*` rules now only apply to `@media` statements.

## 1.2.0

- Added: `function-linear-gradient-no-nonstandard-direction` rule.
- Added: `rule-properties-order` now by default ignores the order of properties left out of your specified array; and the options `"top"`, `"bottom"`, and `"ignore"` are provided to change that behavior.
- Added: `rule-properties-order` now looks for roots of hyphenated properties in custom arrays so each extension (e.g. `padding-top` as an extension of `padding`) does not need to be specified individually.
- Added: `"always-single-line"` option to `declaration-colon-space-after`.
- Added: support for declarations directly on root (e.g. Sass variable declarations).
- Fixed: `declaration-colon-newline-after` `"always-multi-line"` warning message.

## 1.1.0

- Added: `declaration-colon-newline-after` rule.
- Added: the `indentation` rule now checks indentation of multi-line at-rule params, unless there's the `except` option of `param`.
- Added: support for end-of-line comments in `selector-list-comma-newline-after`.
- Added: protection against `#${sass-interpolation}` in rules checking for hex colors.
- Added: support for strings (translated to RegExps) in `custom-property-pattern` and `custom-media-pattern`.
- Fixed: bug preventing various rules from registering the correct rule names in their warnings, and therefore also preventing them from being disabled with comments.
- Fixed: the `color-no-invalid-hex` rule no longer flags hashes in `url()` arguments.
- Fixed: rules using `node.raw()` instead of `node.raws` to avoid expected errors.

## 1.0.1

- Fixed: `postcss-selector-parser` updated to improve location accuracy for `selector-no-*` rules.

## 1.0.0

- Removed: compatibility with PostCSS `4.x`.
- Added: compatibility with PostCSS `5.0.2+`.
- Fixed: the accuracy of reported line numbers and columns.

## 0.8.0

- Added: `after-comment` `ignore` option to the `at-rule-empty-line-before` rule.
- Fixed: the `indentation` rule now correctly handles `*` hacks on property names.
- Fixed: the `media-feature-colon-space-after` and `media-feature-colon-space-before` rules now only apply to `@media` statements.
- Fixed: the `rule-no-shorthand-property-overrides` rule message is now consistent with the other messages.

## 0.7.0

- Added: invalid options cause the rule to abort instead of performing meaningless checks.
- Added: special warning for missing required options from `validateOptions()`.

## 0.6.2

- Fixed: npm package no longer includes test files (reducing package size by 500KB).

## 0.6.1

- Fixed: the `rule-properties-order` and `rule-no-duplicate-properties` rules now correctly check inside @rules.

## 0.6.0

- Added: `validateOptions` to `stylelint.utils` for use by authors of custom rules.
- Added: `custom-media-pattern` rule.
- Added: `number-max-precision` rule.

## 0.5.0

- Added: validation of all rule options.

## 0.4.1

- Removed: `ruleTester` from `stylelint.utils` because of the additional dependencies it forces.

## 0.4.0

- Removed: `jsesc` devDependency.
- Added: `rule-no-shorthand-property-overrides` rule.
- Added: `ruleTester` to `stylelint.utils` for use by authors of custom rules.

## 0.3.2

- Fixed: `hierarchicalSelectors` bug in `indentation` rule.

## 0.3.1

- Fixed: `~=` is no longer mistaken for combinator in `selector-combinator-space-*`.

## 0.3.0

- Added: exposure of `report`, `ruleMessages`, and `styleSearch` in `stylelint.utils` for use by external plugin rules.
- Added: plugin rule support.
- Added: `hierarchicalSelectors` option to `indentation` rule.
- Added: `nesting-block-opening-brace-space-before` rule.
- Added: `nesting-block-opening-brace-newline-before` rule.
- Fixed: the `color-hex-case` rule message is now consistent with the `color-hex-length` rule.
- Fixed: the `property-blacklist` rule message is now consistent with the `property-whitelist` rule.
- Fixed: a typo in the `comment-space-inside` rule message.

## 0.2.0

- Added: `color-hex-case` rule.
- Added: `color-hex-length` rule.
- Fixed: formalized selector-indentation-checking within the `indentation` rule.
- Fixed: allow for arbitrary whitespace after the newline in the `selector-list-comma-newline-*` rules.
- Fixed: `selector-combinator-space-*` no longer checks `:nth-child()` arguments.

## 0.1.2

- Fixed: nesting support for the `block-opening-brace-newline-before` rule.
- Fixed: nesting support for the `block-opening-brace-space-before` rule.
- Fixed: nesting support for the `rule-trailing-semicolon` rule.

## 0.1.1

- Fixed: nesting support for the `rule-no-duplicate-properties` rule.
- Fixed: nesting support for the `rule-properties-order` rule.
- Fixed: whitespace rules accommodate Windows CR-LF line endings.

## 0.1.0

- Added: ability to disable rules via comments in the CSS.
- Added: `at-rule-empty-line-before` rule.
- Added: `at-rule-no-vendor-prefix` rule.
- Added: `block-closing-brace-newline-after` rule.
- Added: `block-closing-brace-newline-before` rule.
- Added: `block-closing-brace-space-after` rule.
- Added: `block-closing-brace-space-before` rule.
- Added: `block-no-empty` rule.
- Added: `block-opening-brace-newline-after` rule.
- Added: `block-opening-brace-newline-before` rule.
- Added: `block-opening-brace-space-after` rule.
- Added: `block-opening-brace-space-before` rule.
- Added: `color-no-invalid-hex` rule.
- Added: `comment-empty-line-before` rule.
- Added: `comment-space-inside` rule.
- Added: `custom-property-no-outside-root` rule.
- Added: `custom-property-pattern` rule.
- Added: `declaration-bang-space-after` rule.
- Added: `declaration-bang-space-before` rule.
- Added: `declaration-block-semicolon-newline-after` rule.
- Added: `declaration-block-semicolon-newline-before` rule.
- Added: `declaration-block-semicolon-space-after` rule.
- Added: `declaration-block-semicolon-space-before` rule.
- Added: `declaration-colon-space-after` rule.
- Added: `declaration-colon-space-before` rule.
- Added: `declaration-no-important` rule.
- Added: `function-calc-no-unspaced-operator` rule.
- Added: `function-comma-space-after` rule.
- Added: `function-comma-space-before` rule.
- Added: `function-parentheses-space-inside` rule.
- Added: `function-space-after` rule.
- Added: `function-url-quotes` rule.
- Added: `indentation` rule.
- Added: `media-feature-colon-space-after` rule.
- Added: `media-feature-colon-space-before` rule.
- Added: `media-feature-name-no-vendor-prefix` rule.
- Added: `media-feature-range-operator-space-after` rule.
- Added: `media-feature-range-operator-space-before` rule.
- Added: `media-query-list-comma-newline-after` rule.
- Added: `media-query-list-comma-newline-before` rule.
- Added: `media-query-list-comma-space-after` rule.
- Added: `media-query-list-comma-space-before` rule.
- Added: `media-query-parentheses-space-inside` rule.
- Added: `no-eol-whitespace` rule.
- Added: `no-missing-eof-newline` rule.
- Added: `no-multiple-empty-lines` rule.
- Added: `number-leading-zero` rule.
- Added: `number-no-trailing-zeros` rule.
- Added: `number-zero-length-no-unit` rule.
- Added: `property-blacklist` rule.
- Added: `property-no-vendor-prefix` rule.
- Added: `property-whitelist` rule.
- Added: `root-no-standard-properties` rule.
- Added: `rule-nested-empty-line-before` rule.
- Added: `rule-no-duplicate-properties` rule.
- Added: `rule-no-single-line` rule.
- Added: `rule-non-nested-empty-line-before` rule.
- Added: `rule-properties-order` rule.
- Added: `rule-trailing-semicolon` rule.
- Added: `selector-combinator-space-after` rule.
- Added: `selector-combinator-space-before` rule.
- Added: `selector-list-comma-newline-after` rule.
- Added: `selector-list-comma-newline-before` rule.
- Added: `selector-list-comma-space-after` rule.
- Added: `selector-list-comma-space-before` rule.
- Added: `selector-no-attribute` rule.
- Added: `selector-no-combinator` rule.
- Added: `selector-no-id` rule.
- Added: `selector-no-type` rule.
- Added: `selector-no-universal` rule.
- Added: `selector-no-vendor-prefix` rule.
- Added: `selector-pseudo-element-colon-notation` rule.
- Added: `selector-root-no-composition` rule.
- Added: `string-quotes` rule.
- Added: `value-list-comma-newline-after` rule.
- Added: `value-list-comma-newline-before` rule.
- Added: `value-list-comma-space-after` rule.
- Added: `value-list-comma-space-before` rule.
- Added: `value-no-vendor-prefix` rule.
