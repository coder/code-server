// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const isSingleLineString = require('../../utils/isSingleLineString');
const isStandardSyntaxFunction = require('../../utils/isStandardSyntaxFunction');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'function-parentheses-newline-inside';

const messages = ruleMessages(ruleName, {
	expectedOpening: 'Expected newline after "("',
	expectedClosing: 'Expected newline before ")"',
	expectedOpeningMultiLine: 'Expected newline after "(" in a multi-line function',
	rejectedOpeningMultiLine: 'Unexpected whitespace after "(" in a multi-line function',
	expectedClosingMultiLine: 'Expected newline before ")" in a multi-line function',
	rejectedClosingMultiLine: 'Unexpected whitespace before ")" in a multi-line function',
});

function rule(expectation, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'always-multi-line', 'never-multi-line'],
		});

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			if (!decl.value.includes('(')) {
				return;
			}

			let hasFixed = false;
			const declValue = getDeclarationValue(decl);
			const parsedValue = valueParser(declValue);

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== 'function') {
					return;
				}

				if (!isStandardSyntaxFunction(valueNode)) {
					return;
				}

				const functionString = valueParser.stringify(valueNode);
				const isMultiLine = !isSingleLineString(functionString);

				function containsNewline(str) {
					return str.includes('\n');
				}

				// Check opening ...

				const openingIndex = valueNode.sourceIndex + valueNode.value.length + 1;
				const checkBefore = getCheckBefore(valueNode);

				if (expectation === 'always' && !containsNewline(checkBefore)) {
					if (context.fix) {
						hasFixed = true;
						fixBeforeForAlways(valueNode, context.newline);
					} else {
						complain(messages.expectedOpening, openingIndex);
					}
				}

				if (isMultiLine && expectation === 'always-multi-line' && !containsNewline(checkBefore)) {
					if (context.fix) {
						hasFixed = true;
						fixBeforeForAlways(valueNode, context.newline);
					} else {
						complain(messages.expectedOpeningMultiLine, openingIndex);
					}
				}

				if (isMultiLine && expectation === 'never-multi-line' && checkBefore !== '') {
					if (context.fix) {
						hasFixed = true;
						fixBeforeForNever(valueNode);
					} else {
						complain(messages.rejectedOpeningMultiLine, openingIndex);
					}
				}

				// Check closing ...

				const closingIndex = valueNode.sourceIndex + functionString.length - 2;
				const checkAfter = getCheckAfter(valueNode);

				if (expectation === 'always' && !containsNewline(checkAfter)) {
					if (context.fix) {
						hasFixed = true;
						fixAfterForAlways(valueNode, context.newline);
					} else {
						complain(messages.expectedClosing, closingIndex);
					}
				}

				if (isMultiLine && expectation === 'always-multi-line' && !containsNewline(checkAfter)) {
					if (context.fix) {
						hasFixed = true;
						fixAfterForAlways(valueNode, context.newline);
					} else {
						complain(messages.expectedClosingMultiLine, closingIndex);
					}
				}

				if (isMultiLine && expectation === 'never-multi-line' && checkAfter !== '') {
					if (context.fix) {
						hasFixed = true;
						fixAfterForNever(valueNode);
					} else {
						complain(messages.rejectedClosingMultiLine, closingIndex);
					}
				}
			});

			if (hasFixed) {
				setDeclarationValue(decl, parsedValue.toString());
			}

			function complain(message, offset) {
				report({
					ruleName,
					result,
					message,
					node: decl,
					index: declarationValueIndex(decl) + offset,
				});
			}
		});
	};
}

function getCheckBefore(valueNode) {
	let before = valueNode.before;

	for (const node of valueNode.nodes) {
		if (node.type === 'comment') {
			continue;
		}

		if (node.type === 'space') {
			before += node.value;
			continue;
		}

		break;
	}

	return before;
}

function getCheckAfter(valueNode) {
	let after = '';

	for (const node of valueNode.nodes.slice().reverse()) {
		if (node.type === 'comment') {
			continue;
		}

		if (node.type === 'space') {
			after = node.value + after;
			continue;
		}

		break;
	}

	after += valueNode.after;

	return after;
}

function fixBeforeForAlways(valueNode, newline) {
	let target;

	for (const node of valueNode.nodes) {
		if (node.type === 'comment') {
			continue;
		}

		if (node.type === 'space') {
			target = node;
			continue;
		}

		break;
	}

	if (target) {
		target.value = newline + target.value;
	} else {
		valueNode.before = newline + valueNode.before;
	}
}

function fixBeforeForNever(valueNode) {
	valueNode.before = '';

	for (const node of valueNode.nodes) {
		if (node.type === 'comment') {
			continue;
		}

		if (node.type === 'space') {
			node.value = '';
			continue;
		}

		break;
	}
}

function fixAfterForAlways(valueNode, newline) {
	valueNode.after = newline + valueNode.after;
}

function fixAfterForNever(valueNode) {
	valueNode.after = '';

	for (const node of valueNode.nodes.slice().reverse()) {
		if (node.type === 'comment') {
			continue;
		}

		if (node.type === 'space') {
			node.value = '';
			continue;
		}

		break;
	}
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
