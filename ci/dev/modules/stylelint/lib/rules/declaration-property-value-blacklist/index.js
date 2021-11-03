// @ts-nocheck

'use strict';

const _ = require('lodash');
const matchesStringOrRegExp = require('../../utils/matchesStringOrRegExp');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const vendor = require('../../utils/vendor');

const ruleName = 'declaration-property-value-blacklist';

const messages = ruleMessages(ruleName, {
	rejected: (property, value) => `Unexpected value "${value}" for property "${property}"`,
});

function rule(list) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: list,
			possible: [_.isObject],
		});

		if (!validOptions) {
			return;
		}

		result.warn(
			`'${ruleName}' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.`,
			{
				stylelintType: 'deprecation',
				stylelintReference: `https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/${ruleName}/README.md`,
			},
		);

		root.walkDecls((decl) => {
			const prop = decl.prop;
			const value = decl.value;

			const unprefixedProp = vendor.unprefixed(prop);
			const propList = _.find(list, (values, propIdentifier) =>
				matchesStringOrRegExp(unprefixedProp, propIdentifier),
			);

			if (_.isEmpty(propList)) {
				return;
			}

			if (!matchesStringOrRegExp(value, propList)) {
				return;
			}

			report({
				message: messages.rejected(prop, value),
				node: decl,
				result,
				ruleName,
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { deprecated: true };

module.exports = rule;
