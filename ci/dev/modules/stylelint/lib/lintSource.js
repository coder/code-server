'use strict';

const lintPostcssResult = require('./lintPostcssResult');
const path = require('path');

/** @typedef {import('stylelint').StylelintInternalApi} StylelintInternalApi */
/** @typedef {import('stylelint').GetLintSourceOptions} Options */
/** @typedef {import('postcss').Result} Result */
/** @typedef {import('stylelint').PostcssResult} PostcssResult */
/** @typedef {import('stylelint').StylelintPostcssResult} StylelintPostcssResult */

/**
 * Run stylelint on a PostCSS Result, either one that is provided
 * or one that we create
 * @param {StylelintInternalApi} stylelint
 * @param {Options} options
 * @returns {Promise<PostcssResult>}
 */
module.exports = function lintSource(stylelint, options = {}) {
	if (!options.filePath && options.code === undefined && !options.existingPostcssResult) {
		return Promise.reject(new Error('You must provide filePath, code, or existingPostcssResult'));
	}

	const isCodeNotFile = options.code !== undefined;

	const inputFilePath = isCodeNotFile ? options.codeFilename : options.filePath;

	if (inputFilePath !== undefined && !path.isAbsolute(inputFilePath)) {
		if (isCodeNotFile) {
			return Promise.reject(new Error('codeFilename must be an absolute path'));
		}

		return Promise.reject(new Error('filePath must be an absolute path'));
	}

	const getIsIgnored = stylelint.isPathIgnored(inputFilePath).catch((err) => {
		if (isCodeNotFile && err.code === 'ENOENT') return false;

		throw err;
	});

	return getIsIgnored.then((isIgnored) => {
		if (isIgnored) {
			/** @type {PostcssResult} */

			return options.existingPostcssResult
				? Object.assign(options.existingPostcssResult, {
						stylelint: createEmptyStylelintPostcssResult(),
				  })
				: createEmptyPostcssResult(inputFilePath);
		}

		const configSearchPath = stylelint._options.configFile || inputFilePath;

		const getConfig = stylelint.getConfigForFile(configSearchPath).catch((err) => {
			if (isCodeNotFile && err.code === 'ENOENT') return stylelint.getConfigForFile(process.cwd());

			throw err;
		});

		return getConfig.then((result) => {
			if (!result) {
				throw new Error('Config file not found');
			}

			const config = result.config;
			const existingPostcssResult = options.existingPostcssResult;
			const stylelintResult = {
				ruleSeverities: {},
				customMessages: {},
				disabledRanges: {},
			};

			if (existingPostcssResult) {
				const stylelintPostcssResult = Object.assign(existingPostcssResult, {
					stylelint: stylelintResult,
				});

				return lintPostcssResult(stylelint._options, stylelintPostcssResult, config).then(
					() => stylelintPostcssResult,
				);
			}

			return stylelint
				._getPostcssResult({
					code: options.code,
					codeFilename: options.codeFilename,
					filePath: inputFilePath,
					codeProcessors: config.codeProcessors,
				})
				.then((postcssResult) => {
					const stylelintPostcssResult = Object.assign(postcssResult, {
						stylelint: stylelintResult,
					});

					return lintPostcssResult(stylelint._options, stylelintPostcssResult, config).then(
						() => stylelintPostcssResult,
					);
				});
		});
	});
};

/**
 * @returns {StylelintPostcssResult}
 */
function createEmptyStylelintPostcssResult() {
	return {
		ruleSeverities: {},
		customMessages: {},
		disabledRanges: {},
		ignored: true,
		stylelintError: false,
	};
}

/**
 * @param {string} [filePath]
 * @returns {PostcssResult}
 */
function createEmptyPostcssResult(filePath) {
	return {
		root: {
			source: {
				input: { file: filePath },
			},
		},
		messages: [],
		opts: undefined,
		stylelint: createEmptyStylelintPostcssResult(),
		warn: () => {},
	};
}
