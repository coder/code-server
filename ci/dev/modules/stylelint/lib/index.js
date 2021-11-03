'use strict';

const checkAgainstRule = require('./utils/checkAgainstRule');
const createPlugin = require('./createPlugin');
const createStylelint = require('./createStylelint');
const formatters = require('./formatters');
const postcssPlugin = require('./postcssPlugin');
const report = require('./utils/report');
const ruleMessages = require('./utils/ruleMessages');
const rules = require('./rules');
const standalone = require('./standalone');
const validateOptions = require('./utils/validateOptions');

/**
 * TODO TYPES change any to appropriated options
 * @type {import('postcss').Plugin<any> & Partial<import('stylelint').StylelintPublicAPI>}
 */
const api = postcssPlugin;

api.utils = {
	report,
	ruleMessages,
	validateOptions,
	checkAgainstRule,
};

api.lint = standalone;
api.rules = rules;
api.formatters = formatters;
api.createPlugin = createPlugin;
api.createLinter = createStylelint;

module.exports = api;
