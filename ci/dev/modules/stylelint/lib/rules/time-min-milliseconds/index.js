// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const keywordSets = require('../../reference/keywordSets');
const optionsMatches = require('../../utils/optionsMatches');
const postcss = require('postcss');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');
const vendor = require('../../utils/vendor');

const ruleName = 'time-min-milliseconds';

const messages = ruleMessages(ruleName, {
	expected: (time) => `Expected a minimum of ${time} milliseconds`,
});

const DELAY_PROPERTIES = new Set(['animation-delay', 'transition-delay']);

function rule(minimum, options) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: minimum,
				possible: _.isNumber,
			},
			{
				actual: options,
				possible: {
					ignore: ['delay'],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			const propertyName = vendor.unprefixed(decl.prop.toLowerCase());

			if (
				keywordSets.longhandTimeProperties.has(propertyName) &&
				!isIgnoredProperty(propertyName) &&
				!isAcceptableTime(decl.value)
			) {
				complain(decl);
			}

			if (keywordSets.shorthandTimeProperties.has(propertyName)) {
				const valueListList = postcss.list.comma(decl.value);

				for (const valueListString of valueListList) {
					const valueList = postcss.list.space(valueListString);

					if (optionsMatches(options, 'ignore', 'delay')) {
						// Check only duration time values
						const duration = getDuration(valueList);

						if (duration && !isAcceptableTime(duration)) {
							complain(decl, decl.value.indexOf(duration));
						}
					} else {
						// Check all time values
						for (const value of valueList) {
							if (!isAcceptableTime(value)) {
								complain(decl, decl.value.indexOf(value));
							}
						}
					}
				}
			}
		});

		/**
		 * Get the duration within an `animation` or `transition` shorthand property value.
		 *
		 * @param {Node[]} valueList
		 *
		 * @returns {Node}
		 */
		function getDuration(valueList) {
			for (const value of valueList) {
				const parsedTime = valueParser.unit(value);

				if (!parsedTime) continue;

				// The first numeric value in an animation shorthand is the duration.
				return value;
			}
		}

		function isIgnoredProperty(propertyName) {
			if (optionsMatches(options, 'ignore', 'delay') && DELAY_PROPERTIES.has(propertyName)) {
				return true;
			}

			return false;
		}

		function isAcceptableTime(time) {
			const parsedTime = valueParser.unit(time);

			if (!parsedTime) return true;

			if (parsedTime.number <= 0) {
				return true;
			}

			if (parsedTime.unit.toLowerCase() === 'ms' && parsedTime.number < minimum) {
				return false;
			}

			if (parsedTime.unit.toLowerCase() === 's' && parsedTime.number * 1000 < minimum) {
				return false;
			}

			return true;
		}

		function complain(decl, offset = 0) {
			report({
				result,
				ruleName,
				message: messages.expected(minimum),
				index: declarationValueIndex(decl) + offset,
				node: decl,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
