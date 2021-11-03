// @ts-nocheck

'use strict';

const _ = require('lodash');
const atRuleParamIndex = require('../../utils/atRuleParamIndex');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'media-feature-parentheses-space-inside';

const messages = ruleMessages(ruleName, {
	expectedOpening: 'Expected single space after "("',
	rejectedOpening: 'Unexpected whitespace after "("',
	expectedClosing: 'Expected single space before ")"',
	rejectedClosing: 'Unexpected whitespace before ")"',
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		root.walkAtRules(/^media$/i, (atRule) => {
			// If there are comments in the params, the complete string
			// will be at atRule.raws.params.raw
			const params = _.get(atRule, 'raws.params.raw', atRule.params);
			const indexBoost = atRuleParamIndex(atRule);
			const violations = [];

			const parsedParams = valueParser(params).walk((node) => {
				if (node.type === 'function') {
					const len = valueParser.stringify(node).length;

					if (expectation === 'never') {
						if (/[ \t]/.test(node.before)) {
							if (context.fix) node.before = '';

							violations.push({
								message: messages.rejectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
							});
						}

						if (/[ \t]/.test(node.after)) {
							if (context.fix) node.after = '';

							violations.push({
								message: messages.rejectedClosing,
								index: node.sourceIndex - 2 + len + indexBoost,
							});
						}
					} else if (expectation === 'always') {
						if (node.before === '') {
							if (context.fix) node.before = ' ';

							violations.push({
								message: messages.expectedOpening,
								index: node.sourceIndex + 1 + indexBoost,
							});
						}

						if (node.after === '') {
							if (context.fix) node.after = ' ';

							violations.push({
								message: messages.expectedClosing,
								index: node.sourceIndex - 2 + len + indexBoost,
							});
						}
					}
				}
			});

			if (violations.length) {
				if (context.fix) {
					atRule.params = parsedParams.toString();

					return;
				}

				violations.forEach((err) => {
					report({
						message: err.message,
						node: atRule,
						index: err.index,
						result,
						ruleName,
					});
				});
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
