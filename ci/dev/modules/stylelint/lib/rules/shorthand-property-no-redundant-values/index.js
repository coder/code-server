// @ts-nocheck

'use strict';

const isStandardSyntaxDeclaration = require('../../utils/isStandardSyntaxDeclaration');
const isStandardSyntaxProperty = require('../../utils/isStandardSyntaxProperty');
const report = require('../../utils/report');
const ruleMessages = require('../../utils/ruleMessages');
const validateOptions = require('../../utils/validateOptions');
const valueParser = require('postcss-value-parser');
const vendor = require('../../utils/vendor');

const ruleName = 'shorthand-property-no-redundant-values';

const messages = ruleMessages(ruleName, {
	rejected: (unexpected, expected) =>
		`Unexpected longhand value '${unexpected}' instead of '${expected}'`,
});

const propertiesWithShorthandNotation = new Set([
	'margin',
	'padding',
	'border-color',
	'border-radius',
	'border-style',
	'border-width',
	'grid-gap',
]);

const ignoredCharacters = ['+', '*', '/', '(', ')', '$', '@', '--', 'var('];

function hasIgnoredCharacters(value) {
	return ignoredCharacters.some((char) => value.includes(char));
}

function isShorthandProperty(property) {
	return propertiesWithShorthandNotation.has(property);
}

function canCondense(top, right, bottom, left) {
	const lowerTop = top.toLowerCase();
	const lowerRight = right.toLowerCase();
	const lowerBottom = bottom && bottom.toLowerCase();
	const lowerLeft = left && left.toLowerCase();

	if (canCondenseToOneValue(lowerTop, lowerRight, lowerBottom, lowerLeft)) {
		return [top];
	}

	if (canCondenseToTwoValues(lowerTop, lowerRight, lowerBottom, lowerLeft)) {
		return [top, right];
	}

	if (canCondenseToThreeValues(lowerTop, lowerRight, lowerBottom, lowerLeft)) {
		return [top, right, bottom];
	}

	return [top, right, bottom, left];
}

function canCondenseToOneValue(top, right, bottom, left) {
	if (top !== right) {
		return false;
	}

	return (top === bottom && (bottom === left || !left)) || (!bottom && !left);
}

function canCondenseToTwoValues(top, right, bottom, left) {
	return (top === bottom && right === left) || (top === bottom && !left && top !== right);
}

function canCondenseToThreeValues(top, right, bottom, left) {
	return right === left;
}

function rule(actual, secondary, context) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, { actual });

		if (!validOptions) {
			return;
		}

		root.walkDecls((decl) => {
			if (!isStandardSyntaxDeclaration(decl) || !isStandardSyntaxProperty(decl.prop)) {
				return;
			}

			const prop = decl.prop;
			const value = decl.value;

			const normalizedProp = vendor.unprefixed(prop.toLowerCase());

			if (hasIgnoredCharacters(value) || !isShorthandProperty(normalizedProp)) {
				return;
			}

			const valuesToShorthand = [];

			valueParser(value).walk((valueNode) => {
				if (valueNode.type !== 'word') {
					return;
				}

				valuesToShorthand.push(valueParser.stringify(valueNode));
			});

			if (valuesToShorthand.length <= 1 || valuesToShorthand.length > 4) {
				return;
			}

			const shortestForm = canCondense(...valuesToShorthand);
			const shortestFormString = shortestForm.filter(Boolean).join(' ');
			const valuesFormString = valuesToShorthand.join(' ');

			if (shortestFormString.toLowerCase() === valuesFormString.toLowerCase()) {
				return;
			}

			if (context.fix) {
				decl.value = decl.value.replace(value, shortestFormString);
			} else {
				report({
					message: messages.rejected(value, shortestFormString),
					node: decl,
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
