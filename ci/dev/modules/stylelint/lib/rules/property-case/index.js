// @ts-nocheck

'use strict';

const isCustomProperty = require('../../utils/isCustomProperty');
const isStandardSyntaxProperty = require('../../utils/isStandardSyntaxProperty');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'property-case';

const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['lower', 'upper'],
		});

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const prop = decl.prop;

			if (!isStandardSyntaxProperty(prop)) {
				return;
			}

			if (isCustomProperty(prop)) {
				return;
			}

			const expectedProp = expectation === 'lower' ? prop.toLowerCase() : prop.toUpperCase();

			if (prop === expectedProp) {
				return;
			}

			if (context.fix) {
				decl.prop = expectedProp;

				return;
			}

			report({
				message: messages.expected(prop, expectedProp),
				node: decl,
				ruleName,
				result,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
