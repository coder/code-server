// @ts-nocheck

'use strict';

const ruleMessages = require('../../utils/ruleMessages');
const selectorCombinatorSpaceChecker = require('../selectorCombinatorSpaceChecker');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'selector-combinator-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: (combinator) => `Expected single space after "${combinator}"`,
	rejectedAfter: (combinator) => `Unexpected whitespace after "${combinator}"`,
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
			locationChecker: checker.after,
			locationType: 'after',
			checkedRuleName: ruleName,
			fix: context.fix
				? (combinator) => {
						if (expectation === 'always') {
							combinator.spaces.after = ' ';

							return true;
						}

						if (expectation === 'never') {
							combinator.spaces.after = '';

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
