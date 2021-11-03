'use strict';

const createPartialStylelintResult = require('./createPartialStylelintResult');

/** @typedef {import('stylelint').PostcssResult} PostcssResult */
/** @typedef {import('postcss').NodeSource} NodeSource */
/** @typedef {import('stylelint').StylelintResult} StylelintResult */

/**
 * @param {import('stylelint').StylelintInternalApi} stylelint
 * @param {PostcssResult} [postcssResult]
 * @param {string} [filePath]
 * @param {import('stylelint').StylelintCssSyntaxError} [cssSyntaxError]
 * @return {Promise<StylelintResult>}
 */
module.exports = function (stylelint, postcssResult, filePath, cssSyntaxError) {
	let stylelintResult = createPartialStylelintResult(postcssResult, cssSyntaxError);

	return stylelint.getConfigForFile(filePath).then((configForFile) => {
		// TODO TYPES handle possible null here
		const config = /** @type {{ config: import('stylelint').StylelintConfig, filepath: string }} */ (configForFile)
			.config;
		const file = stylelintResult.source || (cssSyntaxError && cssSyntaxError.file);

		if (config.resultProcessors) {
			config.resultProcessors.forEach((resultProcessor) => {
				// Result processors might just mutate the result object,
				// or might return a new one
				const returned = resultProcessor(stylelintResult, file);

				if (returned) {
					stylelintResult = returned;
				}
			});
		}

		return stylelintResult;
	});
};
