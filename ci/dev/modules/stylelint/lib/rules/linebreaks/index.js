// @ts-nocheck

'use strict';

const _ = require('lodash');
const postcss = require('postcss');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'linebreaks';

const messages = ruleMessages(ruleName, {
	expected: (linebreak) => `Expected linebreak to be ${linebreak}`,
});

function rule(actual, secondary, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual,
			possible: ['unix', 'windows'],
		});

		if (!validOptions) {
			return;
		}

		const shouldHaveCR = actual === 'windows';

		if (context.fix) {
			const propertiesToUpdate = ['selector', 'raws.before', 'raws.after', 'value', 'text'];

			root.walk((node) => {
				propertiesToUpdate.forEach((property) => {
					const fixedData = fixData(_.get(node, property));

					_.set(node, property, fixedData);
				});
			});

			root.raws.after = fixData(root.raws.after);
		} else {
			const lines = root.source.input.css.split('\n');

			for (let i = 0; i < lines.length; i++) {
				let line = lines[i];

				if (i < lines.length - 1 && !line.includes('\r')) {
					line += '\n';
				}

				if (hasError(line)) {
					const lineNum = i + 1;
					const colNum = line.length;

					reportNewlineError(lineNum, colNum);
				}
			}
		}

		function hasError(dataToCheck) {
			const hasNewlineToVerify = /[\r\n]/.test(dataToCheck);
			const hasCR = hasNewlineToVerify ? /\r/.test(dataToCheck) : false;

			return hasNewlineToVerify && hasCR !== shouldHaveCR;
		}

		function fixData(data) {
			if (data) {
				let res = data.replace(/\r/g, '');

				if (shouldHaveCR) {
					res = res.replace(/\n/g, '\r\n');
				}

				return res;
			}

			return data;
		}

		function reportNewlineError(line, column) {
			// Creating a node manually helps us to point to empty lines.
			const node = postcss.rule({
				source: {
					start: { line, column },
				},
			});

			report({
				message: messages.expected(actual),
				node,
				result,
				ruleName,
			});
		}
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
