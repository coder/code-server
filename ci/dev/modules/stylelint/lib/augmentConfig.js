'use strict';

const _ = require('lodash');
const configurationError = require('./utils/configurationError');
const getModulePath = require('./utils/getModulePath');
const globjoin = require('globjoin');
const normalizeAllRuleSettings = require('./normalizeAllRuleSettings');
const path = require('path');

/** @typedef {import('stylelint').StylelintConfigPlugins} StylelintConfigPlugins */
/** @typedef {import('stylelint').StylelintConfigProcessor} StylelintConfigProcessor */
/** @typedef {import('stylelint').StylelintConfigProcessors} StylelintConfigProcessors */
/** @typedef {import('stylelint').StylelintConfigRules} StylelintConfigRules */
/** @typedef {import('stylelint').StylelintInternalApi} StylelintInternalApi */
/** @typedef {import('stylelint').StylelintConfig} StylelintConfig */
/** @typedef {import('stylelint').CosmiconfigResult} CosmiconfigResult */

/**
 * - Merges config and configOverrides
 * - Makes all paths absolute
 * - Merges extends
 * @param {StylelintInternalApi} stylelint
 * @param {StylelintConfig} config
 * @param {string} configDir
 * @param {boolean} [allowOverrides]
 * @returns {Promise<StylelintConfig>}
 */
function augmentConfigBasic(stylelint, config, configDir, allowOverrides) {
	return Promise.resolve()
		.then(() => {
			if (!allowOverrides) return config;

			return _.merge(config, stylelint._options.configOverrides);
		})
		.then((augmentedConfig) => {
			return extendConfig(stylelint, augmentedConfig, configDir);
		})
		.then((augmentedConfig) => {
			return absolutizePaths(augmentedConfig, configDir);
		});
}

/**
 * Extended configs need to be run through augmentConfigBasic
 * but do not need the full treatment. Things like pluginFunctions
 * will be resolved and added by the parent config.
 * @param {StylelintInternalApi} stylelint
 * @param {CosmiconfigResult} [cosmiconfigResult]
 * @returns {Promise<CosmiconfigResult | null>}
 */
function augmentConfigExtended(stylelint, cosmiconfigResult) {
	if (!cosmiconfigResult) return Promise.resolve(null);

	const configDir = path.dirname(cosmiconfigResult.filepath || '');
	const { ignoreFiles, ...cleanedConfig } = cosmiconfigResult.config;

	return augmentConfigBasic(stylelint, cleanedConfig, configDir).then((augmentedConfig) => {
		return {
			config: augmentedConfig,
			filepath: cosmiconfigResult.filepath,
		};
	});
}

/**
 * @param {StylelintInternalApi} stylelint
 * @param {CosmiconfigResult} [cosmiconfigResult]
 * @returns {Promise<CosmiconfigResult | null>}
 */
function augmentConfigFull(stylelint, cosmiconfigResult) {
	if (!cosmiconfigResult) return Promise.resolve(null);

	const config = cosmiconfigResult.config;
	const filepath = cosmiconfigResult.filepath;

	const configDir = stylelint._options.configBasedir || path.dirname(filepath || '');

	return augmentConfigBasic(stylelint, config, configDir, true)
		.then((augmentedConfig) => {
			return addPluginFunctions(augmentedConfig);
		})
		.then((augmentedConfig) => {
			return addProcessorFunctions(augmentedConfig);
		})
		.then((augmentedConfig) => {
			if (!augmentedConfig.rules) {
				throw configurationError(
					'No rules found within configuration. Have you provided a "rules" property?',
				);
			}

			return normalizeAllRuleSettings(augmentedConfig);
		})
		.then((augmentedConfig) => {
			return {
				config: augmentedConfig,
				filepath: cosmiconfigResult.filepath,
			};
		});
}

/**
 * Make all paths in the config absolute:
 * - ignoreFiles
 * - plugins
 * - processors
 * (extends handled elsewhere)
 * @param {StylelintConfig} config
 * @param {string} configDir
 * @returns {StylelintConfig}
 */
function absolutizePaths(config, configDir) {
	if (config.ignoreFiles) {
		config.ignoreFiles = /** @type {string[]} */ ([]).concat(config.ignoreFiles).map((glob) => {
			if (path.isAbsolute(glob.replace(/^!/, ''))) return glob;

			return globjoin(configDir, glob);
		});
	}

	if (config.plugins) {
		config.plugins = /** @type {string[]} */ ([]).concat(config.plugins).map((lookup) => {
			return getModulePath(configDir, lookup);
		});
	}

	if (config.processors) {
		config.processors = absolutizeProcessors(config.processors, configDir);
	}

	return config;
}

/**
 * Processors are absolutized in their own way because
 * they can be and return a string or an array
 * @param {StylelintConfigProcessors} processors
 * @param {string} configDir
 * @return {StylelintConfigProcessors}
 */
function absolutizeProcessors(processors, configDir) {
	const normalizedProcessors = Array.isArray(processors) ? processors : [processors];

	return normalizedProcessors.map((item) => {
		if (typeof item === 'string') {
			return getModulePath(configDir, item);
		}

		return [getModulePath(configDir, item[0]), item[1]];
	});
}

/**
 * @param {StylelintInternalApi} stylelint
 * @param {StylelintConfig} config
 * @param {string} configDir
 * @return {Promise<StylelintConfig>}
 */
function extendConfig(stylelint, config, configDir) {
	if (config.extends === undefined) return Promise.resolve(config);

	const normalizedExtends = Array.isArray(config.extends) ? config.extends : [config.extends];
	const { extends: configExtends, ...originalWithoutExtends } = config;

	const loadExtends = normalizedExtends.reduce((resultPromise, extendLookup) => {
		return resultPromise.then((resultConfig) => {
			return loadExtendedConfig(stylelint, resultConfig, configDir, extendLookup).then(
				(extendResult) => {
					if (!extendResult) return resultConfig;

					return mergeConfigs(resultConfig, extendResult.config);
				},
			);
		});
	}, Promise.resolve(originalWithoutExtends));

	return loadExtends.then((resultConfig) => {
		return mergeConfigs(resultConfig, originalWithoutExtends);
	});
}

/**
 * @param {StylelintInternalApi} stylelint
 * @param {StylelintConfig} config
 * @param {string} configDir
 * @param {string} extendLookup
 * @return {Promise<CosmiconfigResult | null>}
 */
function loadExtendedConfig(stylelint, config, configDir, extendLookup) {
	const extendPath = getModulePath(configDir, extendLookup);

	return stylelint._extendExplorer.load(extendPath);
}

/**
 * When merging configs (via extends)
 * - plugin and processor arrays are joined
 * - rules are merged via Object.assign, so there is no attempt made to
 *   merge any given rule's settings. If b contains the same rule as a,
 *   b's rule settings will override a's rule settings entirely.
 * - Everything else is merged via Object.assign
 * @param {StylelintConfig} a
 * @param {StylelintConfig} b
 * @returns {StylelintConfig}
 */
function mergeConfigs(a, b) {
	/** @type {{plugins: StylelintConfigPlugins}} */
	const pluginMerger = {};

	if (a.plugins || b.plugins) {
		pluginMerger.plugins = [];

		if (a.plugins) {
			pluginMerger.plugins = pluginMerger.plugins.concat(a.plugins);
		}

		if (b.plugins) {
			pluginMerger.plugins = [...new Set(pluginMerger.plugins.concat(b.plugins))];
		}
	}

	/** @type {{processors: StylelintConfigProcessors}} */
	const processorMerger = {};

	if (a.processors || b.processors) {
		processorMerger.processors = [];

		if (a.processors) {
			processorMerger.processors = processorMerger.processors.concat(a.processors);
		}

		if (b.processors) {
			processorMerger.processors = [...new Set(processorMerger.processors.concat(b.processors))];
		}
	}

	const rulesMerger = {};

	if (a.rules || b.rules) {
		rulesMerger.rules = { ...a.rules, ...b.rules };
	}

	const result = { ...a, ...b, ...processorMerger, ...pluginMerger, ...rulesMerger };

	return result;
}

/**
 * @param {StylelintConfig} config
 * @returns {StylelintConfig}
 */
function addPluginFunctions(config) {
	if (!config.plugins) return config;

	const normalizedPlugins = Array.isArray(config.plugins) ? config.plugins : [config.plugins];

	const pluginFunctions = normalizedPlugins.reduce((result, pluginLookup) => {
		let pluginImport = require(pluginLookup);

		// Handle either ES6 or CommonJS modules
		pluginImport = pluginImport.default || pluginImport;

		// A plugin can export either a single rule definition
		// or an array of them
		const normalizedPluginImport = Array.isArray(pluginImport) ? pluginImport : [pluginImport];

		normalizedPluginImport.forEach((pluginRuleDefinition) => {
			if (!pluginRuleDefinition.ruleName) {
				throw configurationError(
					'stylelint v3+ requires plugins to expose a ruleName. ' +
						`The plugin "${pluginLookup}" is not doing this, so will not work ` +
						'with stylelint v3+. Please file an issue with the plugin.',
				);
			}

			if (!pluginRuleDefinition.ruleName.includes('/')) {
				throw configurationError(
					'stylelint v7+ requires plugin rules to be namespaced, ' +
						'i.e. only `plugin-namespace/plugin-rule-name` plugin rule names are supported. ' +
						`The plugin rule "${pluginRuleDefinition.ruleName}" does not do this, so will not work. ` +
						'Please file an issue with the plugin.',
				);
			}

			result[pluginRuleDefinition.ruleName] = pluginRuleDefinition.rule;
		});

		return result;
	}, /** @type {{[k: string]: Function}} */ ({}));

	config.pluginFunctions = pluginFunctions;

	return config;
}

/**
 * Given an array of processors strings, we want to add two
 * properties to the augmented config:
 * - codeProcessors: functions that will run on code as it comes in
 * - resultProcessors: functions that will run on results as they go out
 *
 * To create these properties, we need to:
 * - Find the processor module
 * - Initialize the processor module by calling its functions with any
 *   provided options
 * - Push the processor's code and result processors to their respective arrays
 * @type {Map<string, string | Object>}
 */
const processorCache = new Map();

/**
 * @param {StylelintConfig} config
 * @return {StylelintConfig}
 */
function addProcessorFunctions(config) {
	if (!config.processors) return config;

	/** @type {Array<Function>} */
	const codeProcessors = [];
	/** @type {Array<Function>} */
	const resultProcessors = [];

	/** @type {Array<StylelintConfigProcessor>} */ ([])
		.concat(config.processors)
		.forEach((processorConfig) => {
			const processorKey = JSON.stringify(processorConfig);

			let initializedProcessor;

			if (processorCache.has(processorKey)) {
				initializedProcessor = processorCache.get(processorKey);
			} else {
				const processorLookup =
					typeof processorConfig === 'string' ? processorConfig : processorConfig[0];
				const processorOptions =
					typeof processorConfig === 'string' ? undefined : processorConfig[1];
				let processor = require(processorLookup);

				processor = processor.default || processor;
				initializedProcessor = processor(processorOptions);
				processorCache.set(processorKey, initializedProcessor);
			}

			if (initializedProcessor && initializedProcessor.code) {
				codeProcessors.push(initializedProcessor.code);
			}

			if (initializedProcessor && initializedProcessor.result) {
				resultProcessors.push(initializedProcessor.result);
			}
		});

	config.codeProcessors = codeProcessors;
	config.resultProcessors = resultProcessors;

	return config;
}

module.exports = { augmentConfigExtended, augmentConfigFull };
