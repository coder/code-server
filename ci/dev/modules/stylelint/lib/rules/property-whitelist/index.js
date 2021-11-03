// @ts-nocheck

'use strict';

const _ = require('lodash');
const isCustomProperty = require('../../utils/isCustomProperty');
const isStandardSyntaxProperty = require('../../utils/isStandardSyntaxProperty');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'property-whitelist';

const messages = ruleMessages(ruleName, {
	rejected: (property) => `Unexpected property "${property}"`,
});

function rule(list) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isString, _.isRegExp],
		});

		if (!validOptions) {
			return;
		}

		result.warn(`'${ruleName}' has been deprecated. Instead use 'property-allowed-list'.`, {
			stylelintType: 'deprecation',
			stylelintReference: `https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/${ruleName}/README.md`,
		});

		root.walkDecls((decl) => {
			const prop = decl.prop;

			if (!isStandardSyntaxProperty(prop)) {
				return;
			}

			if (isCustomProperty(prop)) {
				return;
			}

			if (matchesStringOrRegExp(vendor.unprefixed(prop), list)) {
				return;
			}

			report({
				message: messages.rejected(prop),
				node: decl,
				result,
				ruleName,
			});
		});
	};
}

rule.primaryOptionArray = true;

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { deprecated: true };

module.exports = rule;
