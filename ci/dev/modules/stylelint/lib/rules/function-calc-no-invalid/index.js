// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const isStandardSyntaxMathFunction = require('../../utils/isStandardSyntaxMathFunction');
const parseCalcExpression = require('../../utils/parseCalcExpression');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'function-calc-no-invalid';

const messages = ruleMessages(ruleName, {
	expectedExpression: () => 'Expected a valid expression',
	expectedSpaceBeforeOperator: (operator) => `Expected space before "${operator}" operator`,
	expectedSpaceAfterOperator: (operator) => `Expected space after "${operator}" operator`,
	rejectedDivisionByZero: () => 'Unexpected division by zero',
	expectedValidResolvedType: (operator) =>
		`Expected to be compatible with the left and right argument types of "${operator}" operation.`,
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const checked = [];

			valueParser(decl.value).walk((node) => {
				if (node.type !== 'function' || node.value.toLowerCase() !== 'calc') {
					return;
				}

				const mathFunction = valueParser.stringify(node);

				if (!isStandardSyntaxMathFunction(mathFunction)) {
					return;
				}

				if (checked.includes(node)) {
					return;
				}

				checked.push(...getCalcNodes(node));

				checked.push(...node.nodes);

				let ast;

				try {
					ast = parseCalcExpression(mathFunction);
				} catch (e) {
					if (e.hash && e.hash.loc) {
						complain(messages.expectedExpression(), node.sourceIndex + e.hash.loc.range[0]);

						return;
					}

					throw e;
				}

				verifyMathExpressions(ast, node);
			});

			function complain(message, valueIndex) {
				report({
					message,
					node: decl,
					index: declarationValueIndex(decl) + valueIndex,
					result,
					ruleName,
				});
			}

			/**
			 * Verify that each operation expression is valid.
			 * Reports when a invalid operation expression is found.
			 * @param {object} expression expression node.
			 * @param {object} node calc function node.
			 * @returns {void}
			 */
			function verifyMathExpressions(expression, node) {
				if (expression.type === 'MathExpression') {
					const { operator, left, right } = expression;

					if (operator === '+' || operator === '-') {
						if (expression.source.operator.end.index === right.source.start.index) {
							complain(
								messages.expectedSpaceAfterOperator(operator),
								node.sourceIndex + expression.source.operator.end.index,
							);
						}

						if (expression.source.operator.start.index === left.source.end.index) {
							complain(
								messages.expectedSpaceBeforeOperator(operator),
								node.sourceIndex + expression.source.operator.start.index,
							);
						}
					} else if (operator === '/') {
						if (
							(right.type === 'Value' && right.value === 0) ||
							(right.type === 'MathExpression' && getNumber(right) === 0)
						) {
							complain(
								messages.rejectedDivisionByZero(),
								node.sourceIndex + expression.source.operator.end.index,
							);
						}
					}

					if (getResolvedType(expression) === 'invalid') {
						complain(
							messages.expectedValidResolvedType(operator),
							node.sourceIndex + expression.source.operator.start.index,
						);
					}

					verifyMathExpressions(expression.left, node);
					verifyMathExpressions(expression.right, node);
				}
			}
		});
	};
}

function getCalcNodes(node) {
	if (node.type !== 'function') {
		return [];
	}

	const functionName = node.value.toLowerCase();
	const result = [];

	if (functionName === 'calc') {
		result.push(node);
	}

	if (!functionName || functionName === 'calc') {
		// find nested calc
		for (const c of node.nodes) {
			result.push(...getCalcNodes(c));
		}
	}

	return result;
}

function getNumber(mathExpression) {
	const { left, right } = mathExpression;

	const leftValue =
		left.type === 'Value' ? left.value : left.type === 'MathExpression' ? getNumber(left) : null;
	const rightValue =
		right.type === 'Value'
			? right.value
			: right.type === 'MathExpression'
			? getNumber(right)
			: null;

	if (leftValue == null || rightValue == null) {
		return null;
	}

	switch (mathExpression.operator) {
		case '+':
			return leftValue + rightValue;
		case '-':
			return leftValue - rightValue;
		case '*':
			return leftValue * rightValue;
		case '/':
			return leftValue / rightValue;
	}

	return null;
}

function getResolvedType(mathExpression) {
	const { left: leftExpression, operator, right: rightExpression } = mathExpression;
	let left =
		leftExpression.type === 'MathExpression'
			? getResolvedType(leftExpression)
			: leftExpression.type;
	let right =
		rightExpression.type === 'MathExpression'
			? getResolvedType(rightExpression)
			: rightExpression.type;

	if (left === 'Function' || left === 'invalid') {
		left = 'UnknownValue';
	}

	if (right === 'Function' || right === 'invalid') {
		right = 'UnknownValue';
	}

	switch (operator) {
		case '+':
		case '-':
			if (left === 'UnknownValue' || right === 'UnknownValue') {
				return 'UnknownValue';
			}

			if (left === right) {
				return left;
			}

			if (left === 'Value' || right === 'Value') {
				return 'invalid';
			}

			if (left === 'PercentageValue') {
				return right;
			}

			if (right === 'PercentageValue') {
				return left;
			}

			return 'invalid';
		case '*':
			if (left === 'UnknownValue' || right === 'UnknownValue') {
				return 'UnknownValue';
			}

			if (left === 'Value') {
				return right;
			}

			if (right === 'Value') {
				return left;
			}

			return 'invalid';
		case '/':
			if (right === 'UnknownValue') {
				return 'UnknownValue';
			}

			if (right === 'Value') {
				return left;
			}

			return 'invalid';
	}

	return 'UnknownValue';
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
