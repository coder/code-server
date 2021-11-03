// @ts-nocheck

'use strict';

const _ = require('lodash');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'function-max-empty-lines';

const messages = ruleMessages(ruleName, {
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? 'line' : 'lines'}`,
});

function placeIndexOnValueStart(decl) {
	return decl.prop.length + decl.raws.between.length - 1;
}

function rule(max, options, context) {
	const maxAdjacentNewlines = max + 1;

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: max,
			possible: _.isNumber,
		});

		if (!validOptions) {
			return;
		}

		const violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`);
		const violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`);
		const allowedLFNewLinesString = context.fix ? '\n'.repeat(maxAdjacentNewlines) : '';
		const allowedCRLFNewLinesString = context.fix ? '\r\n'.repeat(maxAdjacentNewlines) : '';

		root.walkDecls((decl) => {
			if (!decl.value.includes('(')) {
				return;
			}

			const stringValue = getDeclarationValue(decl);
			const splittedValue = [];
			let sourceIndexStart = 0;

			valueParser(stringValue).walk((node) => {
				if (
					node.type !== 'function' /* ignore non functions */ ||
					node.value.length === 0 /* ignore sass lists */
				) {
					return;
				}

				const stringifiedNode = valueParser.stringify(node);

				if (
					!violatedLFNewLinesRegex.test(stringifiedNode) &&
					!violatedCRLFNewLinesRegex.test(stringifiedNode)
				) {
					return;
				}

				if (context.fix) {
					const newNodeString = stringifiedNode
						.replace(new RegExp(violatedLFNewLinesRegex, 'gm'), allowedLFNewLinesString)
						.replace(new RegExp(violatedCRLFNewLinesRegex, 'gm'), allowedCRLFNewLinesString);

					splittedValue.push([
						stringValue.slice(sourceIndexStart, node.sourceIndex),
						newNodeString,
					]);
					sourceIndexStart = node.sourceIndex + stringifiedNode.length;
				} else {
					report({
						message: messages.expected(max),
						node: decl,
						index: placeIndexOnValueStart(decl) + node.sourceIndex,
						result,
						ruleName,
					});
				}
			});

			if (context.fix && splittedValue.length > 0) {
				const updatedValue =
					splittedValue.reduce((acc, curr) => acc + curr[0] + curr[1], '') +
					stringValue.slice(sourceIndexStart);

				setDeclarationValue(decl, updatedValue);
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
