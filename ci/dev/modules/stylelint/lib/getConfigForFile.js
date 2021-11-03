'use strict';

const augmentConfigFull = require('./augmentConfig').augmentConfigFull;
const configurationError = require('./utils/configurationError');
const path = require('path');

/** @typedef {import('stylelint').StylelintConfig} StylelintConfig */
/** @typedef {import('stylelint').CosmiconfigResult} CosmiconfigResult */
/** @typedef {Promise<CosmiconfigResult | null>} ConfigPromise  */

/**
 * @param {import('stylelint').StylelintInternalApi} stylelint
 * @param {string} [searchPath]
 * @returns {ConfigPromise}
 */
module.exports = function (stylelint, searchPath = process.cwd()) {
	const optionsConfig = stylelint._options.config;

	if (optionsConfig !== undefined) {
		const cached = /** @type {ConfigPromise} */ (stylelint._specifiedConfigCache.get(
			optionsConfig,
		));

		if (cached) return cached;

		// stylelint._fullExplorer (cosmiconfig) is already configured to
		// run augmentConfigFull; but since we're making up the result here,
		// we need to manually run the transform
		const augmentedResult = augmentConfigFull(stylelint, {
			config: optionsConfig,
			// Add the extra path part so that we can get the directory without being
			// confused
			filepath: path.join(process.cwd(), 'argument-config'),
		});

		stylelint._specifiedConfigCache.set(optionsConfig, augmentedResult);

		return augmentedResult;
	}

	const searchForConfig = stylelint._options.configFile
		? stylelint._fullExplorer.load(stylelint._options.configFile)
		: stylelint._fullExplorer.search(searchPath);

	return /** @type {ConfigPromise} */ (searchForConfig
		.then((config) => {
			// If no config was found, try looking from process.cwd
			if (!config) return stylelint._fullExplorer.search(process.cwd());

			return config;
		})
		.then((config) => {
			if (!config) {
				const ending = searchPath ? ` for ${searchPath}` : '';

				throw configurationError(`No configuration provided${ending}`);
			}

			return config;
		}));
};
