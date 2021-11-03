'use strict';

const _ = require('lodash');
const createStylelint = require('./createStylelint');
const globby = require('globby');
const path = require('path');

/** @typedef {import('stylelint').StylelintConfig} StylelintConfig */

/**
 * @param {import('stylelint').StylelintStandaloneOptions} options
 * @returns {Promise<StylelintConfig | null>}
 */
module.exports = function (options) {
	const code = options.code;
	const config = options.config;
	const configBasedir = options.configBasedir;
	const configFile = options.configFile;
	const configOverrides = options.configOverrides;
	const globbyOptions = options.globbyOptions;
	const files = options.files;

	const isCodeNotFile = code !== undefined;

	if (!files || files.length !== 1 || isCodeNotFile) {
		return Promise.reject(
			new Error('The --print-config option must be used with exactly one file path.'),
		);
	}

	const filePath = files[0];

	if (globby.hasMagic(filePath)) {
		return Promise.reject(new Error('The --print-config option does not support globs.'));
	}

	const stylelint = createStylelint({
		config,
		configFile,
		configBasedir,
		configOverrides,
	});

	const cwd = _.get(globbyOptions, 'cwd', process.cwd());
	const absoluteFilePath = !path.isAbsolute(filePath)
		? path.join(cwd, filePath)
		: path.normalize(filePath);

	const configSearchPath = stylelint._options.configFile || absoluteFilePath;

	return stylelint.getConfigForFile(configSearchPath).then((result) => {
		if (result === null) {
			return result;
		}

		return result.config;
	});
};
