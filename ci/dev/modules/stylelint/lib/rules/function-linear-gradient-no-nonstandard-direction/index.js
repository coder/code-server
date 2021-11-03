// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const functionArgumentsSearch = require('../../utils/functionArgumentsSearch');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');
const vendor = require('../../utils/vendor');

const ruleName = 'function-linear-gradient-no-nonstandard-direction';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected nonstandard direction',
});

function isStandardDirection(source, withToPrefix) {
	const regexp = withToPrefix
		? /^to (top|left|bottom|right)(?: (top|left|bottom|right))?$/
		: /^(top|left|bottom|right)(?: (top|left|bottom|right))?$/;

	const matches = source.match(regexp);

	if (!matches) {
		return false;
	}

	if (matches.length === 2) {
		return true;
	}

	// Cannot repeat side-or-corner, e.g. "to top top"
	if (matches.length === 3 && matches[1] !== matches[2]) {
		return true;
	}

	return false;
}

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			valueParser(decl.value).walk((valueNode) => {
				if (valueNode.type !== 'function') {
					return;
				}

				functionArgumentsSearch(
					valueParser.stringify(valueNode).toLowerCase(),
					'linear-gradient',
					(expression, expressionIndex) => {
						const firstArg = expression.split(',')[0].trim();

						// If the first arg is not standard, return early
						if (!isStandardSyntaxValue(firstArg)) {
							return;
						}

						// If the first character is a number, we can assume the user intends an angle
						if (/[\d.]/.test(firstArg[0])) {
							if (/^[\d.]+(?:deg|grad|rad|turn)$/.test(firstArg)) {
								return;
							}

							complain();

							return;
						}

						// The first argument may not be a direction: it may be an angle,
						// or a color stop (in which case user gets default direction, "to bottom")
						// cf. https://drafts.csswg.org/css-images-3/#linear-gradient-syntax
						if (!/left|right|top|bottom/.test(firstArg)) {
							return;
						}

						const withToPrefix = !vendor.prefix(valueNode.value);

						if (!isStandardDirection(firstArg, withToPrefix)) {
							complain();
						}

						function complain() {
							report({
								message: messages.rejected,
								node: decl,
								index: declarationValueIndex(decl) + valueNode.sourceIndex + expressionIndex,
								result,
								ruleName,
							});
						}
					},
				);
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
