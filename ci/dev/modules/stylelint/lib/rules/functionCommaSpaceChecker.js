// @ts-nocheck

'use strict';

const declarationValueIndex = require('../utils/declarationValueIndex');
const getDeclarationValue = require('../utils/getDeclarationValue');
const isStandardSyntaxFunction = require('../utils/isStandardSyntaxFunction');
const report = require('../utils/report');
const setDeclarationValue = require('../utils/setDeclarationValue');
const valueParser = require('postcss-value-parser');

module.exports = function (opts) {
	opts.root.walkDecls((decl) => {
		const declValue = getDeclarationValue(decl);

		let hasFixed;
		const parsedValue = valueParser(declValue);

		parsedValue.walk((valueNode) => {
			if (valueNode.type !== 'function') {
				return;
			}

			if (!isStandardSyntaxFunction(valueNode)) {
				return;
			}

			// Ignore `url()` arguments, which may contain data URIs or other funky stuff
			if (valueNode.value.toLowerCase() === 'url') {
				return;
			}

			const argumentStrings = valueNode.nodes.map((node) => valueParser.stringify(node));

			const functionArguments = (() => {
				// Remove function name and parens
				let result = valueNode.before + argumentStrings.join('') + valueNode.after;

				// 1. Remove comments including preceding whitespace (when only succeeded by whitespace)
				// 2. Remove all other comments, but leave adjacent whitespace intact
				result = result.replace(/( *\/(\*.*\*\/(?!\S)|\/.*)|(\/(\*.*\*\/|\/.*)))/, '');

				return result;
			})();

			/**
			 * Gets the index of the comma for checking.
			 * @param {Node} commaNode The comma node
			 * @param {number} nodeIndex The index of the comma node
			 * @returns {number} The index of the comma for checking
			 */
			function getCommaCheckIndex(commaNode, nodeIndex) {
				let commaBefore =
					valueNode.before + argumentStrings.slice(0, nodeIndex).join('') + commaNode.before;

				// 1. Remove comments including preceding whitespace (when only succeeded by whitespace)
				// 2. Remove all other comments, but leave adjacent whitespace intact
				commaBefore = commaBefore.replace(/( *\/(\*.*\*\/(?!\S)|\/.*)|(\/(\*.*\*\/|\/.*)))/, '');

				return commaBefore.length;
			}

			const commaDataList = [];

			valueNode.nodes.forEach((node, nodeIndex) => {
				if (node.type !== 'div' || node.value !== ',') {
					return;
				}

				const checkIndex = getCommaCheckIndex(node, nodeIndex);

				commaDataList.push({
					commaNode: node,
					checkIndex,
					nodeIndex,
				});
			});

			for (const { commaNode, checkIndex, nodeIndex } of commaDataList) {
				opts.locationChecker({
					source: functionArguments,
					index: checkIndex,
					err: (message) => {
						const index =
							declarationValueIndex(decl) + commaNode.sourceIndex + commaNode.before.length;

						if (opts.fix && opts.fix(commaNode, nodeIndex, valueNode.nodes)) {
							hasFixed = true;

							return;
						}

						report({
							index,
							message,
							node: decl,
							result: opts.result,
							ruleName: opts.checkedRuleName,
						});
					},
				});
			}
		});

		if (hasFixed) {
			setDeclarationValue(decl, parsedValue.toString());
		}
	});
};
