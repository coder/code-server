// @ts-nocheck

'use strict';

const valueParser = require('postcss-value-parser');

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'hue-degree-notation';

const messages = ruleMessages(ruleName, {
	expected: (unfixed, fixed) => `Expected "${unfixed}" to be "${fixed}"`,
});

const HUE_FIRST_ARG_FUNCS = ['hsl', 'hsla', 'hwb'];
const HUE_THIRD_ARG_FUNCS = ['lch'];
const HUE_FUNCS = new Set([...HUE_FIRST_ARG_FUNCS, ...HUE_THIRD_ARG_FUNCS]);

function rule(primary, secondary, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: ['angle', 'number'],
		});

		if (!validOptions) return;

		root.walkDecls((decl) => {
			let needsFix = false;
			const parsedValue = valueParser(getDeclarationValue(decl));

			parsedValue.walk((node) => {
				if (node.type !== 'function') return;

				if (!HUE_FUNCS.has(node.value.toLowerCase())) return;

				const hue = findHue(node);

				if (!hue) return;

				const { value } = hue;

				if (!isStandardSyntaxValue(value)) return;

				if (!isDegree(value) && !isNumber(value)) return;

				if (primary === 'angle' && isDegree(value)) return;

				if (primary === 'number' && isNumber(value)) return;

				const fixed = primary === 'angle' ? asDegree(value) : asNumber(value);
				const unfixed = value;

				if (context.fix) {
					hue.value = fixed;
					needsFix = true;

					return;
				}

				report({
					message: messages.expected(unfixed, fixed),
					node: decl,
					index: declarationValueIndex(decl) + hue.sourceIndex,
					result,
					ruleName,
				});
			});

			if (needsFix) {
				setDeclarationValue(decl, parsedValue.toString());
			}
		});
	};
}

function asDegree(value) {
	return `${value}deg`;
}

function asNumber(value) {
	const { number } = valueParser.unit(value);

	return number;
}

function findHue(node) {
	const args = node.nodes.filter(({ type }) => type === 'word' || type === 'function');
	const value = node.value.toLowerCase();

	if (HUE_FIRST_ARG_FUNCS.includes(value)) {
		return args[0];
	}

	if (HUE_THIRD_ARG_FUNCS.includes(value)) {
		return args[2];
	}

	return false;
}

function isDegree(value) {
	const { unit } = valueParser.unit(value);

	return unit && unit.toLowerCase() === 'deg';
}

function isNumber(value) {
	const { unit } = valueParser.unit(value);

	return unit === '';
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
