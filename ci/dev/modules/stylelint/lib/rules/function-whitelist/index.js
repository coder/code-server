// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const isStandardSyntaxFunction = require('../../utils/isStandardSyntaxFunction');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');
const vendor = require('../../utils/vendor');

const ruleName = 'function-whitelist';

const messages = ruleMessages(ruleName, {
	rejected: (name) => `Unexpected function "${name}"`,
});

function rule(listInput) {
	const list = [].concat(listInput);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isString, _.isRegExp],
		});

		if (!validOptions) {
			return;
		}

		result.warn(`'${ruleName}' has been deprecated. Instead use 'function-allowed-list'.`, {
			stylelintType: 'deprecation',
			stylelintReference: `https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/${ruleName}/README.md`,
		});

		root.walkDecls((decl) => {
			const value = decl.value;

			valueParser(value).walk((node) => {
				if (node.type !== 'function') {
					return;
				}

				if (!isStandardSyntaxFunction(node)) {
					return;
				}

				if (matchesStringOrRegExp(vendor.unprefixed(node.value), list)) {
					return;
				}

				report({
					message: messages.rejected(node.value),
					node: decl,
					index: declarationValueIndex(decl) + node.sourceIndex,
					result,
					ruleName,
				});
			});
		});
	};
}

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { deprecated: true };

module.exports = rule;
