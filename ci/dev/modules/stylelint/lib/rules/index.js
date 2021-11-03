// @ts-nocheck

'use strict';

const importLazy = require('import-lazy');

/** @typedef {import('stylelint').StylelintRule} StylelintRule */

/** @type {{[k: string]: StylelintRule}} */
const rules = {
	'alpha-value-notation': importLazy(() => require('./alpha-value-notation'))(),
	'at-rule-allowed-list': importLazy(() => require('./at-rule-allowed-list'))(),
	'at-rule-blacklist': importLazy(() => require('./at-rule-blacklist'))(),
	'at-rule-disallowed-list': importLazy(() => require('./at-rule-disallowed-list'))(),
	'at-rule-empty-line-before': importLazy(() => require('./at-rule-empty-line-before'))(),
	'at-rule-name-case': importLazy(() => require('./at-rule-name-case'))(),
	'at-rule-name-newline-after': importLazy(() => require('./at-rule-name-newline-after'))(),
	'at-rule-semicolon-space-before': importLazy(() => require('./at-rule-semicolon-space-before'))(),
	'at-rule-name-space-after': importLazy(() => require('./at-rule-name-space-after'))(),
	'at-rule-no-unknown': importLazy(() => require('./at-rule-no-unknown'))(),
	'at-rule-no-vendor-prefix': importLazy(() => require('./at-rule-no-vendor-prefix'))(),
	'at-rule-property-required-list': importLazy(() => require('./at-rule-property-required-list'))(),
	'at-rule-property-requirelist': importLazy(() => require('./at-rule-property-requirelist'))(),
	'at-rule-semicolon-newline-after': importLazy(() =>
		require('./at-rule-semicolon-newline-after'),
	)(),
	'at-rule-whitelist': importLazy(() => require('./at-rule-whitelist'))(),
	'block-closing-brace-empty-line-before': importLazy(() =>
		require('./block-closing-brace-empty-line-before'),
	)(),
	'block-closing-brace-newline-after': importLazy(() =>
		require('./block-closing-brace-newline-after'),
	)(),
	'block-closing-brace-newline-before': importLazy(() =>
		require('./block-closing-brace-newline-before'),
	)(),
	'block-closing-brace-space-after': importLazy(() =>
		require('./block-closing-brace-space-after'),
	)(),
	'block-closing-brace-space-before': importLazy(() =>
		require('./block-closing-brace-space-before'),
	)(),
	'block-no-empty': importLazy(() => require('./block-no-empty'))(),
	'block-opening-brace-newline-after': importLazy(() =>
		require('./block-opening-brace-newline-after'),
	)(),
	'block-opening-brace-newline-before': importLazy(() =>
		require('./block-opening-brace-newline-before'),
	)(),
	'block-opening-brace-space-after': importLazy(() =>
		require('./block-opening-brace-space-after'),
	)(),
	'block-opening-brace-space-before': importLazy(() =>
		require('./block-opening-brace-space-before'),
	)(),
	'color-function-notation': importLazy(() => require('./color-function-notation'))(),
	'color-hex-case': importLazy(() => require('./color-hex-case'))(),
	'color-hex-length': importLazy(() => require('./color-hex-length'))(),
	'color-named': importLazy(() => require('./color-named'))(),
	'color-no-hex': importLazy(() => require('./color-no-hex'))(),
	'color-no-invalid-hex': importLazy(() => require('./color-no-invalid-hex'))(),
	'comment-empty-line-before': importLazy(() => require('./comment-empty-line-before'))(),
	'comment-no-empty': importLazy(() => require('./comment-no-empty'))(),
	'comment-pattern': importLazy(() => require('./comment-pattern'))(),
	'comment-whitespace-inside': importLazy(() => require('./comment-whitespace-inside'))(),
	'comment-word-blacklist': importLazy(() => require('./comment-word-blacklist'))(),
	'comment-word-disallowed-list': importLazy(() => require('./comment-word-disallowed-list'))(),
	'custom-media-pattern': importLazy(() => require('./custom-media-pattern'))(),
	'custom-property-empty-line-before': importLazy(() =>
		require('./custom-property-empty-line-before'),
	)(),
	'custom-property-pattern': importLazy(() => require('./custom-property-pattern'))(),
	'declaration-bang-space-after': importLazy(() => require('./declaration-bang-space-after'))(),
	'declaration-bang-space-before': importLazy(() => require('./declaration-bang-space-before'))(),
	'declaration-block-no-duplicate-custom-properties': importLazy(() =>
		require('./declaration-block-no-duplicate-custom-properties'),
	)(),
	'declaration-block-no-duplicate-properties': importLazy(() =>
		require('./declaration-block-no-duplicate-properties'),
	)(),
	'declaration-block-no-redundant-longhand-properties': importLazy(() =>
		require('./declaration-block-no-redundant-longhand-properties'),
	)(),
	'declaration-block-no-shorthand-property-overrides': importLazy(() =>
		require('./declaration-block-no-shorthand-property-overrides'),
	)(),
	'declaration-block-semicolon-newline-after': importLazy(() =>
		require('./declaration-block-semicolon-newline-after'),
	)(),
	'declaration-block-semicolon-newline-before': importLazy(() =>
		require('./declaration-block-semicolon-newline-before'),
	)(),
	'declaration-block-semicolon-space-after': importLazy(() =>
		require('./declaration-block-semicolon-space-after'),
	)(),
	'declaration-block-semicolon-space-before': importLazy(() =>
		require('./declaration-block-semicolon-space-before'),
	)(),
	'declaration-block-single-line-max-declarations': importLazy(() =>
		require('./declaration-block-single-line-max-declarations'),
	)(),
	'declaration-block-trailing-semicolon': importLazy(() =>
		require('./declaration-block-trailing-semicolon'),
	)(),
	'declaration-colon-newline-after': importLazy(() =>
		require('./declaration-colon-newline-after'),
	)(),
	'declaration-colon-space-after': importLazy(() => require('./declaration-colon-space-after'))(),
	'declaration-colon-space-before': importLazy(() => require('./declaration-colon-space-before'))(),
	'declaration-empty-line-before': importLazy(() => require('./declaration-empty-line-before'))(),
	'declaration-no-important': importLazy(() => require('./declaration-no-important'))(),
	'declaration-property-unit-allowed-list': importLazy(() =>
		require('./declaration-property-unit-allowed-list'),
	)(),
	'declaration-property-unit-blacklist': importLazy(() =>
		require('./declaration-property-unit-blacklist'),
	)(),
	'declaration-property-unit-disallowed-list': importLazy(() =>
		require('./declaration-property-unit-disallowed-list'),
	)(),
	'declaration-property-unit-whitelist': importLazy(() =>
		require('./declaration-property-unit-whitelist'),
	)(),
	'declaration-property-value-allowed-list': importLazy(() =>
		require('./declaration-property-value-allowed-list'),
	)(),
	'declaration-property-value-blacklist': importLazy(() =>
		require('./declaration-property-value-blacklist'),
	)(),
	'declaration-property-value-disallowed-list': importLazy(() =>
		require('./declaration-property-value-disallowed-list'),
	)(),
	'declaration-property-value-whitelist': importLazy(() =>
		require('./declaration-property-value-whitelist'),
	)(),
	'font-family-no-missing-generic-family-keyword': importLazy(() =>
		require('./font-family-no-missing-generic-family-keyword'),
	)(),
	'font-family-name-quotes': importLazy(() => require('./font-family-name-quotes'))(),
	'font-family-no-duplicate-names': importLazy(() => require('./font-family-no-duplicate-names'))(),
	'font-weight-notation': importLazy(() => require('./font-weight-notation'))(),
	'function-allowed-list': importLazy(() => require('./function-allowed-list'))(),
	'function-blacklist': importLazy(() => require('./function-blacklist'))(),
	'function-calc-no-invalid': importLazy(() => require('./function-calc-no-invalid'))(),
	'function-calc-no-unspaced-operator': importLazy(() =>
		require('./function-calc-no-unspaced-operator'),
	)(),
	'function-comma-newline-after': importLazy(() => require('./function-comma-newline-after'))(),
	'function-comma-newline-before': importLazy(() => require('./function-comma-newline-before'))(),
	'function-comma-space-after': importLazy(() => require('./function-comma-space-after'))(),
	'function-comma-space-before': importLazy(() => require('./function-comma-space-before'))(),
	'function-disallowed-list': importLazy(() => require('./function-disallowed-list'))(),
	'function-linear-gradient-no-nonstandard-direction': importLazy(() =>
		require('./function-linear-gradient-no-nonstandard-direction'),
	)(),
	'function-max-empty-lines': importLazy(() => require('./function-max-empty-lines'))(),
	'function-name-case': importLazy(() => require('./function-name-case'))(),
	'function-parentheses-newline-inside': importLazy(() =>
		require('./function-parentheses-newline-inside'),
	)(),
	'function-parentheses-space-inside': importLazy(() =>
		require('./function-parentheses-space-inside'),
	)(),
	'function-url-no-scheme-relative': importLazy(() =>
		require('./function-url-no-scheme-relative'),
	)(),
	'function-url-quotes': importLazy(() => require('./function-url-quotes'))(),
	'function-url-scheme-allowed-list': importLazy(() =>
		require('./function-url-scheme-allowed-list'),
	)(),
	'function-url-scheme-blacklist': importLazy(() => require('./function-url-scheme-blacklist'))(),
	'function-url-scheme-disallowed-list': importLazy(() =>
		require('./function-url-scheme-disallowed-list'),
	)(),
	'function-url-scheme-whitelist': importLazy(() => require('./function-url-scheme-whitelist'))(),
	'function-whitespace-after': importLazy(() => require('./function-whitespace-after'))(),
	'function-whitelist': importLazy(() => require('./function-whitelist'))(),
	'hue-degree-notation': importLazy(() => require('./hue-degree-notation'))(),
	'keyframe-declaration-no-important': importLazy(() =>
		require('./keyframe-declaration-no-important'),
	)(),
	'keyframes-name-pattern': importLazy(() => require('./keyframes-name-pattern'))(),
	'length-zero-no-unit': importLazy(() => require('./length-zero-no-unit'))(),
	linebreaks: importLazy(() => require('./linebreaks'))(),
	'max-empty-lines': importLazy(() => require('./max-empty-lines'))(),
	'max-line-length': importLazy(() => require('./max-line-length'))(),
	'max-nesting-depth': importLazy(() => require('./max-nesting-depth'))(),
	'media-feature-colon-space-after': importLazy(() =>
		require('./media-feature-colon-space-after'),
	)(),
	'media-feature-colon-space-before': importLazy(() =>
		require('./media-feature-colon-space-before'),
	)(),
	'media-feature-name-allowed-list': importLazy(() =>
		require('./media-feature-name-allowed-list'),
	)(),
	'media-feature-name-blacklist': importLazy(() => require('./media-feature-name-blacklist'))(),
	'media-feature-name-case': importLazy(() => require('./media-feature-name-case'))(),
	'media-feature-name-disallowed-list': importLazy(() =>
		require('./media-feature-name-disallowed-list'),
	)(),
	'media-feature-name-no-unknown': importLazy(() => require('./media-feature-name-no-unknown'))(),
	'media-feature-name-no-vendor-prefix': importLazy(() =>
		require('./media-feature-name-no-vendor-prefix'),
	)(),
	'media-feature-name-value-allowed-list': importLazy(() =>
		require('./media-feature-name-value-allowed-list'),
	)(),
	'media-feature-name-value-whitelist': importLazy(() =>
		require('./media-feature-name-value-whitelist'),
	)(),
	'media-feature-name-whitelist': importLazy(() => require('./media-feature-name-whitelist'))(),
	'media-feature-parentheses-space-inside': importLazy(() =>
		require('./media-feature-parentheses-space-inside'),
	)(),
	'media-feature-range-operator-space-after': importLazy(() =>
		require('./media-feature-range-operator-space-after'),
	)(),
	'media-feature-range-operator-space-before': importLazy(() =>
		require('./media-feature-range-operator-space-before'),
	)(),
	'media-query-list-comma-newline-after': importLazy(() =>
		require('./media-query-list-comma-newline-after'),
	)(),
	'media-query-list-comma-newline-before': importLazy(() =>
		require('./media-query-list-comma-newline-before'),
	)(),
	'media-query-list-comma-space-after': importLazy(() =>
		require('./media-query-list-comma-space-after'),
	)(),
	'media-query-list-comma-space-before': importLazy(() =>
		require('./media-query-list-comma-space-before'),
	)(),
	'named-grid-areas-no-invalid': importLazy(() => require('./named-grid-areas-no-invalid'))(),
	'no-descending-specificity': importLazy(() => require('./no-descending-specificity'))(),
	'no-duplicate-at-import-rules': importLazy(() => require('./no-duplicate-at-import-rules'))(),
	'no-duplicate-selectors': importLazy(() => require('./no-duplicate-selectors'))(),
	'no-empty-source': importLazy(() => require('./no-empty-source'))(),
	'no-empty-first-line': importLazy(() => require('./no-empty-first-line'))(),
	'no-eol-whitespace': importLazy(() => require('./no-eol-whitespace'))(),
	'no-extra-semicolons': importLazy(() => require('./no-extra-semicolons'))(),
	'no-invalid-double-slash-comments': importLazy(() =>
		require('./no-invalid-double-slash-comments'),
	)(),
	'no-invalid-position-at-import-rule': importLazy(() =>
		require('./no-invalid-position-at-import-rule'),
	)(),
	'no-irregular-whitespace': importLazy(() => require('./no-irregular-whitespace'))(),
	'no-missing-end-of-source-newline': importLazy(() =>
		require('./no-missing-end-of-source-newline'),
	)(),
	'no-unknown-animations': importLazy(() => require('./no-unknown-animations'))(),
	'number-leading-zero': importLazy(() => require('./number-leading-zero'))(),
	'number-max-precision': importLazy(() => require('./number-max-precision'))(),
	'number-no-trailing-zeros': importLazy(() => require('./number-no-trailing-zeros'))(),
	'property-allowed-list': importLazy(() => require('./property-allowed-list'))(),
	'property-blacklist': importLazy(() => require('./property-blacklist'))(),
	'property-case': importLazy(() => require('./property-case'))(),
	'property-disallowed-list': importLazy(() => require('./property-disallowed-list'))(),
	'property-no-unknown': importLazy(() => require('./property-no-unknown'))(),
	'property-no-vendor-prefix': importLazy(() => require('./property-no-vendor-prefix'))(),
	'property-whitelist': importLazy(() => require('./property-whitelist'))(),
	'rule-empty-line-before': importLazy(() => require('./rule-empty-line-before'))(),
	'selector-attribute-brackets-space-inside': importLazy(() =>
		require('./selector-attribute-brackets-space-inside'),
	)(),
	'selector-attribute-name-disallowed-list': importLazy(() =>
		require('./selector-attribute-name-disallowed-list'),
	)(),
	'selector-attribute-operator-allowed-list': importLazy(() =>
		require('./selector-attribute-operator-allowed-list'),
	)(),
	'selector-attribute-operator-blacklist': importLazy(() =>
		require('./selector-attribute-operator-blacklist'),
	)(),
	'selector-attribute-operator-disallowed-list': importLazy(() =>
		require('./selector-attribute-operator-disallowed-list'),
	)(),
	'selector-attribute-operator-space-after': importLazy(() =>
		require('./selector-attribute-operator-space-after'),
	)(),
	'selector-attribute-operator-space-before': importLazy(() =>
		require('./selector-attribute-operator-space-before'),
	)(),
	'selector-attribute-operator-whitelist': importLazy(() =>
		require('./selector-attribute-operator-whitelist'),
	)(),
	'selector-attribute-quotes': importLazy(() => require('./selector-attribute-quotes'))(),
	'selector-class-pattern': importLazy(() => require('./selector-class-pattern'))(),
	'selector-combinator-allowed-list': importLazy(() =>
		require('./selector-combinator-allowed-list'),
	)(),
	'selector-combinator-blacklist': importLazy(() => require('./selector-combinator-blacklist'))(),
	'selector-combinator-disallowed-list': importLazy(() =>
		require('./selector-combinator-disallowed-list'),
	)(),
	'selector-combinator-space-after': importLazy(() =>
		require('./selector-combinator-space-after'),
	)(),
	'selector-combinator-space-before': importLazy(() =>
		require('./selector-combinator-space-before'),
	)(),
	'selector-combinator-whitelist': importLazy(() => require('./selector-combinator-whitelist'))(),
	'selector-descendant-combinator-no-non-space': importLazy(() =>
		require('./selector-descendant-combinator-no-non-space'),
	)(),
	'selector-disallowed-list': importLazy(() => require('./selector-disallowed-list'))(),
	'selector-id-pattern': importLazy(() => require('./selector-id-pattern'))(),
	'selector-list-comma-newline-after': importLazy(() =>
		require('./selector-list-comma-newline-after'),
	)(),
	'selector-list-comma-newline-before': importLazy(() =>
		require('./selector-list-comma-newline-before'),
	)(),
	'selector-list-comma-space-after': importLazy(() =>
		require('./selector-list-comma-space-after'),
	)(),
	'selector-list-comma-space-before': importLazy(() =>
		require('./selector-list-comma-space-before'),
	)(),
	'selector-max-attribute': importLazy(() => require('./selector-max-attribute'))(),
	'selector-max-class': importLazy(() => require('./selector-max-class'))(),
	'selector-max-combinators': importLazy(() => require('./selector-max-combinators'))(),
	'selector-max-compound-selectors': importLazy(() =>
		require('./selector-max-compound-selectors'),
	)(),
	'selector-max-empty-lines': importLazy(() => require('./selector-max-empty-lines'))(),
	'selector-max-id': importLazy(() => require('./selector-max-id'))(),
	'selector-max-pseudo-class': importLazy(() => require('./selector-max-pseudo-class'))(),
	'selector-max-specificity': importLazy(() => require('./selector-max-specificity'))(),
	'selector-max-type': importLazy(() => require('./selector-max-type'))(),
	'selector-max-universal': importLazy(() => require('./selector-max-universal'))(),
	'selector-nested-pattern': importLazy(() => require('./selector-nested-pattern'))(),
	'selector-no-qualifying-type': importLazy(() => require('./selector-no-qualifying-type'))(),
	'selector-no-vendor-prefix': importLazy(() => require('./selector-no-vendor-prefix'))(),
	'selector-pseudo-class-allowed-list': importLazy(() =>
		require('./selector-pseudo-class-allowed-list'),
	)(),
	'selector-pseudo-class-blacklist': importLazy(() =>
		require('./selector-pseudo-class-blacklist'),
	)(),
	'selector-pseudo-class-case': importLazy(() => require('./selector-pseudo-class-case'))(),
	'selector-pseudo-class-disallowed-list': importLazy(() =>
		require('./selector-pseudo-class-disallowed-list'),
	)(),
	'selector-pseudo-class-no-unknown': importLazy(() =>
		require('./selector-pseudo-class-no-unknown'),
	)(),
	'selector-pseudo-class-parentheses-space-inside': importLazy(() =>
		require('./selector-pseudo-class-parentheses-space-inside'),
	)(),
	'selector-pseudo-class-whitelist': importLazy(() =>
		require('./selector-pseudo-class-whitelist'),
	)(),
	'selector-pseudo-element-allowed-list': importLazy(() =>
		require('./selector-pseudo-element-allowed-list'),
	)(),
	'selector-pseudo-element-blacklist': importLazy(() =>
		require('./selector-pseudo-element-blacklist'),
	)(),
	'selector-pseudo-element-case': importLazy(() => require('./selector-pseudo-element-case'))(),
	'selector-pseudo-element-colon-notation': importLazy(() =>
		require('./selector-pseudo-element-colon-notation'),
	)(),
	'selector-pseudo-element-disallowed-list': importLazy(() =>
		require('./selector-pseudo-element-disallowed-list'),
	)(),
	'selector-pseudo-element-no-unknown': importLazy(() =>
		require('./selector-pseudo-element-no-unknown'),
	)(),
	'selector-pseudo-element-whitelist': importLazy(() =>
		require('./selector-pseudo-element-whitelist'),
	)(),
	'selector-type-case': importLazy(() => require('./selector-type-case'))(),
	'selector-type-no-unknown': importLazy(() => require('./selector-type-no-unknown'))(),
	'shorthand-property-no-redundant-values': importLazy(() =>
		require('./shorthand-property-no-redundant-values'),
	)(),
	'string-no-newline': importLazy(() => require('./string-no-newline'))(),
	'string-quotes': importLazy(() => require('./string-quotes'))(),
	'time-min-milliseconds': importLazy(() => require('./time-min-milliseconds'))(),
	'unicode-bom': importLazy(() => require('./unicode-bom'))(),
	'unit-allowed-list': importLazy(() => require('./unit-allowed-list'))(),
	'unit-blacklist': importLazy(() => require('./unit-blacklist'))(),
	'unit-case': importLazy(() => require('./unit-case'))(),
	'unit-disallowed-list': importLazy(() => require('./unit-disallowed-list'))(),
	'unit-no-unknown': importLazy(() => require('./unit-no-unknown'))(),
	'unit-whitelist': importLazy(() => require('./unit-whitelist'))(),
	'value-keyword-case': importLazy(() => require('./value-keyword-case'))(),
	'value-list-comma-newline-after': importLazy(() => require('./value-list-comma-newline-after'))(),
	'value-list-comma-newline-before': importLazy(() =>
		require('./value-list-comma-newline-before'),
	)(),
	'value-list-comma-space-after': importLazy(() => require('./value-list-comma-space-after'))(),
	'value-list-comma-space-before': importLazy(() => require('./value-list-comma-space-before'))(),
	'value-list-max-empty-lines': importLazy(() => require('./value-list-max-empty-lines'))(),
	'value-no-vendor-prefix': importLazy(() => require('./value-no-vendor-prefix'))(),
	indentation: importLazy(() => require('./indentation'))() /* Placedhere for better autofixing */,
};

module.exports = rules;
