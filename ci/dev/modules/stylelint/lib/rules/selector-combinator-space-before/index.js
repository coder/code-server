// @ts-nocheck

'use strict';

const ruleMessages = require('../../utils/ruleMessages');
const selectorCombinatorSpaceChecker = require('../selectorCombinatorSpaceChecker');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'selector-combinator-space-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: (combinator) => `Expected single space before "${combinator}"`,
	rejectedBefore: (combinator) => `Unexpected whitespace before "${combinator}"`,
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		selectorCombinatorSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			locationType: 'before',
			checkedRuleName: ruleName,
			fix: context.fix
				? (combinator) => {
						if (expectation === 'always') {
							combinator.spaces.before = ' ';

							return true;
						}

						if (expectation === 'never') {
							combinator.spaces.before = '';

							return true;
						}
				  }
				: null,
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
