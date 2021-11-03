// @ts-nocheck

'use strict';

const balancedMatch = require('balanced-match');
const isWhitespace = require('../../utils/isWhitespace');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const styleSearch = require('style-search');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'function-calc-no-unspaced-operator';

const messages = ruleMessages(ruleName, {
	expectedBefore: (operator) => `Expected single space before "${operator}" operator`,
	expectedAfter: (operator) => `Expected single space after "${operator}" operator`,
	expectedOperatorBeforeSign: (operator) => `Expected an operator before sign "${operator}"`,
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		function complain(message, node, index) {
			report({ message, node, index, result, ruleName });
		}

		root.walkDecls((decl) => {
			valueParser(decl.value).walk((node) => {
				if (node.type !== 'function' || node.value.toLowerCase() !== 'calc') {
					return;
				}

				const nodeText = valueParser.stringify(node);
				const parensMatch = balancedMatch('(', ')', nodeText);

				if (!parensMatch) {
					throw new Error(`No parens match: "${nodeText}"`);
				}

				const rawExpression = parensMatch.body;
				const expressionIndex =
					decl.source.start.column +
					decl.prop.length +
					(decl.raws.between || '').length +
					node.sourceIndex;
				const expression = blurVariables(rawExpression);

				checkSymbol('+');
				checkSymbol('-');
				checkSymbol('*');
				checkSymbol('/');

				function checkSymbol(symbol) {
					const styleSearchOptions = {
						source: expression,
						target: symbol,
						functionArguments: 'skip',
					};

					styleSearch(styleSearchOptions, (match) => {
						const index = match.startIndex;

						// Deal with signs.
						// (@ and $ are considered "digits" here to allow for variable syntaxes
						// that permit signs in front of variables, e.g. `-$number`)
						// As is "." to deal with fractional numbers without a leading zero
						if ((symbol === '+' || symbol === '-') && /[\d@$.]/.test(expression[index + 1])) {
							const expressionBeforeSign = expression.substr(0, index);

							// Ignore signs that directly follow a opening bracket
							if (expressionBeforeSign[expressionBeforeSign.length - 1] === '(') {
								return;
							}

							// Ignore signs at the beginning of the expression
							if (/^\s*$/.test(expressionBeforeSign)) {
								return;
							}

							// Otherwise, ensure that there is a real operator preceding them
							if (/[*/+-]\s*$/.test(expressionBeforeSign)) {
								return;
							}

							// And if not, complain
							complain(messages.expectedOperatorBeforeSign(symbol), decl, expressionIndex + index);

							return;
						}

						const beforeOk =
							(expression[index - 1] === ' ' && !isWhitespace(expression[index - 2])) ||
							newlineBefore(expression, index - 1);

						if (!beforeOk) {
							complain(messages.expectedBefore(symbol), decl, expressionIndex + index);
						}

						const afterOk =
							(expression[index + 1] === ' ' && !isWhitespace(expression[index + 2])) ||
							expression[index + 1] === '\n' ||
							expression.substr(index + 1, 2) === '\r\n';

						if (!afterOk) {
							complain(messages.expectedAfter(symbol), decl, expressionIndex + index);
						}
					});
				}
			});
		});
	};
}

function blurVariables(source) {
	return source.replace(/[$@][^)\s]+|#{.+?}/g, '0');
}

function newlineBefore(str, startIndex) {
	let index = startIndex;

	while (index && isWhitespace(str[index])) {
		if (str[index] === '\n') return true;

		index--;
	}

	return false;
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
