// @ts-nocheck

'use strict';

const declarationValueIndex = require('../../utils/declarationValueIndex');
const isValidHex = require('../../utils/isValidHex');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');

const ruleName = 'color-no-invalid-hex';

const messages = ruleMessages(ruleName, {
	rejected: (hex) => `Unexpected invalid hex color "${hex}"`,
});

function rule(actual) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			valueParser(decl.value).walk(({ value, type, sourceIndex }) => {
				if (type === 'function' && value.endsWith('url')) return false;

				if (type !== 'word') return;

				const hexMatch = /^#[0-9A-Za-z]+/.exec(value);

				if (!hexMatch) return;

				const hexValue = hexMatch[0];

				if (isValidHex(hexValue)) return;

				report({
					message: messages.rejected(hexValue),
					node: decl,
					index: declarationValueIndex(decl) + sourceIndex,
					result,
					ruleName,
				});
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
