// @ts-nocheck

'use strict';

const declarationColonSpaceChecker = require('../declarationColonSpaceChecker');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'declaration-colon-space-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected single space after ":"',
	rejectedAfter: () => 'Unexpected whitespace after ":"',
	expectedAfterSingleLine: () => 'Expected single space after ":" with a single-line declaration',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never', 'always-single-line'],
		});

		if (!validOptions) {
			return;
		}

		declarationColonSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: context.fix
				? (decl, index) => {
						const colonIndex = index - declarationValueIndex(decl);
						const between = decl.raws.between;

						if (expectation.startsWith('always')) {
							decl.raws.between =
								between.slice(0, colonIndex) + between.slice(colonIndex).replace(/^:\s*/, ': ');

							return true;
						}

						if (expectation === 'never') {
							decl.raws.between =
								between.slice(0, colonIndex) + between.slice(colonIndex).replace(/^:\s*/, ':');

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
