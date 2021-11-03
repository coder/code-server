// @ts-nocheck

'use strict';

const _ = require('lodash');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const findNotContiguousOrRectangular = require('./utils/findNotContiguousOrRectangular');
const isRectangular = require('./utils/isRectangular');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'named-grid-areas-no-invalid';

const messages = ruleMessages(ruleName, {
	expectedToken: () => 'Expected cell token within string',
	expectedSameNumber: () => 'Expected same number of cell tokens in each string',
	expectedRectangle: (name) => `Expected single filled-in rectangle for "${name}"`,
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls(/^grid-template-areas$/i, (decl) => {
			const { value } = decl;

			if (value.toLowerCase().trim() === 'none') return;

			const areas = [];
			let reportSent = false;

			valueParser(value).walk(({ sourceIndex, type, value: tokenValue }) => {
				if (type !== 'string') return;

				if (tokenValue === '') {
					complain(messages.expectedToken(), sourceIndex);
					reportSent = true;

					return;
				}

				areas.push(_.compact(tokenValue.trim().split(' ')));
			});

			if (reportSent) return;

			if (!isRectangular(areas)) {
				complain(messages.expectedSameNumber());

				return;
			}

			const notContiguousOrRectangular = findNotContiguousOrRectangular(areas);

			notContiguousOrRectangular.sort().forEach((name) => {
				complain(messages.expectedRectangle(name));
			});

			function complain(message, sourceIndex = 0) {
				report({
					message,
					node: decl,
					index: declarationValueIndex(decl) + sourceIndex,
					result,
					ruleName,
				});
			}
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
