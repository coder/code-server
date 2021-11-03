// @ts-nocheck

'use strict';

const _ = require('lodash');
const valueParser = require('postcss-value-parser');

const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue');
const optionsMatches = require('../../utils/optionsMatches');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');

const ruleName = 'alpha-value-notation';

const messages = ruleMessages(ruleName, {
	expected: (unfixed, fixed) => `Expected "${unfixed}" to be "${fixed}"`,
});

const ALPHA_PROPS = new Set(['opacity', 'shape-image-threshold']);
const ALPHA_FUNCS = new Set(['hsl', 'hsla', 'hwb', 'lab', 'lch', 'rgb', 'rgba']);

function rule(primary, options, context) {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: ['number', 'percentage'],
			},
			{
				actual: options,
				possible: {
					exceptProperties: [_.isString, _.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) return;

		root.walkDecls((decl) => {
			let needsFix = false;
			const parsedValue = valueParser(getDeclarationValue(decl));

			parsedValue.walk((node) => {
				let alpha;

				if (ALPHA_PROPS.has(decl.prop.toLowerCase())) {
					alpha = findAlphaInValue(node);
				} else {
					if (node.type !== 'function') return;

					if (!ALPHA_FUNCS.has(node.value.toLowerCase())) return;

					alpha = findAlphaInFunction(node);
				}

				if (!alpha) return;

				const { value } = alpha;

				if (!isStandardSyntaxValue(value)) return;

				if (!isNumber(value) && !isPercentage(value)) return;

				const optionFuncs = {
					number: {
						expFunc: isNumber,
						fixFunc: asNumber,
					},
					percentage: {
						expFunc: isPercentage,
						fixFunc: asPercentage,
					},
				};

				let expectation = primary;

				if (optionsMatches(options, 'exceptProperties', decl.prop)) {
					expectation = Object.keys(optionFuncs).filter((key) => key !== expectation);
				}

				if (optionFuncs[expectation].expFunc(value)) return;

				const fixed = optionFuncs[expectation].fixFunc(value);
				const unfixed = value;

				if (context.fix) {
					alpha.value = fixed;
					needsFix = true;

					return;
				}

				report({
					message: messages.expected(unfixed, fixed),
					node: decl,
					index: declarationValueIndex(decl) + alpha.sourceIndex,
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

function asPercentage(value) {
	return `${Number((value * 100).toPrecision(3))}%`;
}

function asNumber(value) {
	const { number } = valueParser.unit(value);

	return Number((number / 100).toPrecision(3));
}

function findAlphaInValue(node) {
	return node.type === 'word' || node.type === 'function' ? node : false;
}

function findAlphaInFunction(node) {
	const args = node.nodes.filter(({ type }) => type === 'word' || type === 'function');

	if (args.length === 4) return args[3];

	const slashNodeIndex = node.nodes.findIndex(({ type, value }) => type === 'div' && value === '/');

	if (slashNodeIndex !== -1) {
		const nodesAfterSlash = node.nodes.slice(slashNodeIndex + 1, node.nodes.length);

		return nodesAfterSlash.find(({ type }) => type === 'word');
	}

	return false;
}

function isPercentage(value) {
	const { unit } = valueParser.unit(value);

	return unit && unit === '%';
}

function isNumber(value) {
	const { unit } = valueParser.unit(value);

	return unit === '';
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
