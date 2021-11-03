'use strict';

const _ = require('lodash');

/** @typedef {import('stylelint').PostcssResult} PostcssResult */
/** @typedef {import('postcss').NodeSource} NodeSource */
/** @typedef {import('stylelint').StylelintResult} StylelintResult */

/**
 * @param {PostcssResult} [postcssResult]
 * @param {import('stylelint').StylelintCssSyntaxError} [cssSyntaxError]
 * @return {StylelintResult}
 */
module.exports = function (postcssResult, cssSyntaxError) {
	/** @type {StylelintResult} */
	let stylelintResult;
	/** @type {string | undefined} */
	let source;

	if (postcssResult && postcssResult.root) {
		if (postcssResult.root.source) {
			source = postcssResult.root.source.input.file;

			if (!source && 'id' in postcssResult.root.source.input) {
				source = postcssResult.root.source.input.id;
			}
		}

		// Strip out deprecation warnings from the messages
		const deprecationMessages = _.remove(postcssResult.messages, {
			stylelintType: 'deprecation',
		});
		const deprecations = deprecationMessages.map((deprecationMessage) => {
			return {
				text: deprecationMessage.text,
				reference: deprecationMessage.stylelintReference,
			};
		});

		// Also strip out invalid options
		const invalidOptionMessages = _.remove(postcssResult.messages, {
			stylelintType: 'invalidOption',
		});
		const invalidOptionWarnings = invalidOptionMessages.map((invalidOptionMessage) => {
			return {
				text: invalidOptionMessage.text,
			};
		});

		const parseErrors = _.remove(postcssResult.messages, {
			stylelintType: 'parseError',
		});

		// This defines the stylelint result object that formatters receive
		stylelintResult = {
			source,
			deprecations,
			invalidOptionWarnings,
			// TODO TYPES check which types are valid? postcss? stylelint?
			/* eslint-disable-next-line object-shorthand */
			parseErrors: /** @type {any} */ (parseErrors),
			errored: postcssResult.stylelint.stylelintError,
			warnings: postcssResult.messages.map((message) => {
				return {
					line: message.line,
					column: message.column,
					rule: message.rule,
					severity: message.severity,
					text: message.text,
				};
			}),
			ignored: postcssResult.stylelint.ignored,
			_postcssResult: postcssResult,
		};
	} else if (cssSyntaxError) {
		if (cssSyntaxError.name !== 'CssSyntaxError') {
			throw cssSyntaxError;
		}

		stylelintResult = {
			source: cssSyntaxError.file || '<input css 1>',
			deprecations: [],
			invalidOptionWarnings: [],
			parseErrors: [],
			errored: true,
			warnings: [
				{
					line: cssSyntaxError.line,
					column: cssSyntaxError.column,
					rule: cssSyntaxError.name,
					severity: 'error',
					text: `${cssSyntaxError.reason} (${cssSyntaxError.name})`,
				},
			],
		};
	} else {
		throw new Error(
			'createPartialStylelintResult must be called with either postcssResult or CssSyntaxError',
		);
	}

	return stylelintResult;
};
