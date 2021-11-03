// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');
const valueListCommaWhitespaceChecker = require('../valueListCommaWhitespaceChecker');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'value-list-comma-newline-after';

const messages = ruleMessages(ruleName, {
	expectedAfter: () => 'Expected newline after ","',
	expectedAfterMultiLine: () => 'Expected newline after "," in a multi-line list',
	rejectedAfterMultiLine: () => 'Unexpected whitespace after "," in a multi-line list',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('newline', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line', 'never-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		let fixData;

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			fix: context.fix
				? (declNode, index) => {
						const valueIndex = declarationValueIndex(declNode);

						if (index <= valueIndex) {
							return false;
						}

						fixData = fixData || new Map();
						const commaIndices = fixData.get(declNode) || [];

						commaIndices.push(index);
						fixData.set(declNode, commaIndices);

						return true;
				  }
				: null,
			determineIndex: (declString, match) => {
				const nextChars = declString.substr(match.endIndex, declString.length - match.endIndex);

				// If there's a // comment, that means there has to be a newline
				// ending the comment so we're fine
				if (/^[ \t]*\/\//.test(nextChars)) {
					return false;
				}

				// If there are spaces and then a comment begins, look for the newline
				return /^[ \t]*\/\*/.test(nextChars)
					? declString.indexOf('*/', match.endIndex) + 1
					: match.startIndex;
			},
		});

		if (fixData) {
			fixData.forEach((commaIndices, decl) => {
				commaIndices
					.sort((a, b) => a - b)
					.reverse()
					.forEach((index) => {
						const value = getDeclarationValue(decl);
						const valueIndex = index - declarationValueIndex(decl);
						const beforeValue = value.slice(0, valueIndex + 1);
						let afterValue = value.slice(valueIndex + 1);

						if (expectation.startsWith('always')) {
							afterValue = context.newline + afterValue;
						} else if (expectation.startsWith('never-multi-line')) {
							afterValue = afterValue.replace(/^\s*/, '');
						}

						setDeclarationValue(decl, beforeValue + afterValue);
					});
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
