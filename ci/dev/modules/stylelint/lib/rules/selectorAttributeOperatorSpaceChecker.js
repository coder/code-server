// @ts-nocheck

'use strict';

const isStandardSyntaxRule = require('../utils/isStandardSyntaxRule');
const parseSelector = require('../utils/parseSelector');
const report = require('../utils/report');
const styleSearch = require('style-search');

module.exports = function (options) {
	options.root.walkRules((rule) => {
		if (!isStandardSyntaxRule(rule)) {
			return;
		}

		if (!rule.selector.includes('[') || !rule.selector.includes('=')) {
			return;
		}

		let hasFixed = false;
		const selector = rule.raws.selector ? rule.raws.selector.raw : rule.selector;

		const fixedSelector = parseSelector(selector, options.result, rule, (selectorTree) => {
			selectorTree.walkAttributes((attributeNode) => {
				const operator = attributeNode.operator;

				if (!operator) {
					return;
				}

				const attributeNodeString = attributeNode.toString();

				styleSearch({ source: attributeNodeString, target: operator }, (match) => {
					const index = options.checkBeforeOperator ? match.startIndex : match.endIndex - 1;

					checkOperator(attributeNodeString, index, rule, attributeNode, operator);
				});
			});
		});

		if (hasFixed) {
			if (!rule.raws.selector) {
				rule.selector = fixedSelector;
			} else {
				rule.raws.selector.raw = fixedSelector;
			}
		}

		function checkOperator(source, index, node, attributeNode, operator) {
			options.locationChecker({
				source,
				index,
				err: (m) => {
					if (options.fix && options.fix(attributeNode)) {
						hasFixed = true;

						return;
					}

					report({
						message: m.replace(
							options.checkBeforeOperator ? operator[0] : operator[operator.length - 1],
							operator,
						),
						node,
						index: attributeNode.sourceIndex + index,
						result: options.result,
						ruleName: options.checkedRuleName,
					});
				},
			});
		}
	});
};
