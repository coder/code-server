// @ts-nocheck

'use strict';

const declarationBangSpaceChecker = require('../declarationBangSpaceChecker');
const declarationValueIndex = require('../../utils/declarationValueIndex');
const getDeclarationValue = require('../../utils/getDeclarationValue');
const ruleMessages = require('../../utils/ruleMessages');
const setDeclarationValue = require('../../utils/setDeclarationValue');
const validateOptions = require('../../utils/validateOptions');
const whitespaceChecker = require('../../utils/whitespaceChecker');

const ruleName = 'declaration-bang-space-before';

const messages = ruleMessages(ruleName, {
	expectedBefore: () => 'Expected single space before "!"',
	rejectedBefore: () => 'Unexpected whitespace before "!"',
});

function rule(expectation, options, context) {
	const checker = whitespaceChecker('space', expectation, messages);

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: expectation,
			possible: ['always', 'never'],
		});

		if (!validOptions) {
			return;
		}

		declarationBangSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: context.fix
				? (decl, index) => {
						let bangIndex = index - declarationValueIndex(decl);
						const value = getDeclarationValue(decl);
						let target;
						let setFixed;

						if (bangIndex < value.length) {
							target = value;
							setFixed = (val) => {
								setDeclarationValue(decl, val);
							};
						} else if (decl.important) {
							target = decl.raws.important || ' !important';
							bangIndex -= value.length;
							setFixed = (val) => {
								decl.raws.important = val;
							};
						} else {
							return false; // not standard
						}

						const targetBefore = target.slice(0, bangIndex);
						const targetAfter = target.slice(bangIndex);

						if (expectation === 'always') {
							// eslint-disable-next-line prefer-template
							setFixed(targetBefore.replace(/\s*$/, '') + ' ' + targetAfter);

							return true;
						}

						if (expectation === 'never') {
							setFixed(targetBefore.replace(/\s*$/, '') + targetAfter);

							return true;
						}
				  }
				: null,
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
