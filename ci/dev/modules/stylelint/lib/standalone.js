'use strict';

const _ = require('lodash');
const createStylelint = require('./createStylelint');
const createStylelintResult = require('./createStylelintResult');
const debug = require('debug')('stylelint:standalone');
const fastGlob = require('fast-glob');
const FileCache = require('./utils/FileCache');
const filterFilePaths = require('./utils/filterFilePaths');
const formatters = require('./formatters');
const fs = require('fs');
const getFormatterOptionsText = require('./utils/getFormatterOptionsText');
const globby = require('globby');
const hash = require('./utils/hash');
const NoFilesFoundError = require('./utils/noFilesFoundError');
const path = require('path');
const pkg = require('../package.json');
const prepareReturnValue = require('./prepareReturnValue');
const { default: ignore } = require('ignore');
const DEFAULT_IGNORE_FILENAME = '.stylelintignore';
const FILE_NOT_FOUND_ERROR_CODE = 'ENOENT';
const ALWAYS_IGNORED_GLOBS = ['**/node_modules/**'];
const writeFileAtomic = require('write-file-atomic');

/** @typedef {import('stylelint').StylelintStandaloneOptions} StylelintStandaloneOptions */
/** @typedef {import('stylelint').StylelintStandaloneReturnValue} StylelintStandaloneReturnValue */
/** @typedef {import('stylelint').StylelintResult} StylelintResult */
/** @typedef {import('stylelint').Formatter} Formatter */
/** @typedef {import('stylelint').FormatterIdentifier} FormatterIdentifier */

/**
 * @param {StylelintStandaloneOptions} options
 * @returns {Promise<StylelintStandaloneReturnValue>}
 */
module.exports = function (options) {
	const cacheLocation = options.cacheLocation;
	const code = options.code;
	const codeFilename = options.codeFilename;
	const config = options.config;
	const configBasedir = options.configBasedir;
	const configFile = options.configFile;
	const configOverrides = options.configOverrides;
	const customSyntax = options.customSyntax;
	const globbyOptions = options.globbyOptions;
	const files = options.files;
	const fix = options.fix;
	const formatter = options.formatter;
	const ignoreDisables = options.ignoreDisables;
	const reportNeedlessDisables = options.reportNeedlessDisables;
	const reportInvalidScopeDisables = options.reportInvalidScopeDisables;
	const reportDescriptionlessDisables = options.reportDescriptionlessDisables;
	const syntax = options.syntax;
	const allowEmptyInput = options.allowEmptyInput || false;
	const useCache = options.cache || false;
	/** @type {FileCache} */
	let fileCache;
	const startTime = Date.now();

	// The ignorer will be used to filter file paths after the glob is checked,
	// before any files are actually read
	const ignoreFilePath = options.ignorePath || DEFAULT_IGNORE_FILENAME;
	const absoluteIgnoreFilePath = path.isAbsolute(ignoreFilePath)
		? ignoreFilePath
		: path.resolve(process.cwd(), ignoreFilePath);
	let ignoreText = '';

	try {
		ignoreText = fs.readFileSync(absoluteIgnoreFilePath, 'utf8');
	} catch (readError) {
		if (readError.code !== FILE_NOT_FOUND_ERROR_CODE) throw readError;
	}

	const ignorePattern = options.ignorePattern || [];
	const ignorer = ignore().add(ignoreText).add(ignorePattern);

	const isValidCode = typeof code === 'string';

	if ((!files && !isValidCode) || (files && (code || isValidCode))) {
		throw new Error('You must pass stylelint a `files` glob or a `code` string, though not both');
	}

	/** @type {Formatter} */
	let formatterFunction;

	try {
		formatterFunction = getFormatterFunction(formatter);
	} catch (error) {
		return Promise.reject(error);
	}

	const stylelint = createStylelint({
		config,
		configFile,
		configBasedir,
		configOverrides,
		ignoreDisables,
		ignorePath: ignoreFilePath,
		reportNeedlessDisables,
		reportInvalidScopeDisables,
		reportDescriptionlessDisables,
		syntax,
		customSyntax,
		fix,
	});

	if (!files) {
		const absoluteCodeFilename =
			codeFilename !== undefined && !path.isAbsolute(codeFilename)
				? path.join(process.cwd(), codeFilename)
				: codeFilename;

		// if file is ignored, return nothing
		if (
			absoluteCodeFilename &&
			!filterFilePaths(ignorer, [path.relative(process.cwd(), absoluteCodeFilename)]).length
		) {
			return Promise.resolve(prepareReturnValue([], options, formatterFunction));
		}

		return stylelint
			._lintSource({
				code,
				codeFilename: absoluteCodeFilename,
			})
			.then((postcssResult) => {
				// Check for file existence
				return /** @type {Promise<void>} */ (new Promise((resolve, reject) => {
					if (!absoluteCodeFilename) {
						reject();

						return;
					}

					fs.stat(absoluteCodeFilename, (err) => {
						if (err) {
							reject();
						} else {
							resolve();
						}
					});
				}))
					.then(() => {
						return stylelint._createStylelintResult(postcssResult, absoluteCodeFilename);
					})
					.catch(() => {
						return stylelint._createStylelintResult(postcssResult);
					});
			})
			.catch(_.partial(handleError, stylelint))
			.then((stylelintResult) => {
				const postcssResult = stylelintResult._postcssResult;
				const returnValue = prepareReturnValue([stylelintResult], options, formatterFunction);

				if (options.fix && postcssResult && !postcssResult.stylelint.ignored) {
					if (!postcssResult.stylelint.disableWritingFix) {
						// If we're fixing, the output should be the fixed code
						returnValue.output = postcssResult.root.toString(postcssResult.opts.syntax);
					} else {
						// If the writing of the fix is disabled, the input code is returned as-is
						returnValue.output = code;
					}
				}

				return returnValue;
			});
	}

	let fileList = files;

	if (typeof fileList === 'string') {
		fileList = [fileList];
	}

	fileList = fileList.map((entry) => {
		const cwd = _.get(globbyOptions, 'cwd', process.cwd());
		const absolutePath = !path.isAbsolute(entry) ? path.join(cwd, entry) : path.normalize(entry);

		if (fs.existsSync(absolutePath)) {
			// This path points to a file. Return an escaped path to avoid globbing
			return fastGlob.escapePath(entry);
		}

		return entry;
	});

	if (!options.disableDefaultIgnores) {
		fileList = fileList.concat(ALWAYS_IGNORED_GLOBS.map((glob) => `!${glob}`));
	}

	if (useCache) {
		const stylelintVersion = pkg.version;
		const hashOfConfig = hash(`${stylelintVersion}_${JSON.stringify(config || {})}`);

		fileCache = new FileCache(cacheLocation, hashOfConfig);
	} else {
		// No need to calculate hash here, we just want to delete cache file.
		fileCache = new FileCache(cacheLocation);
		// Remove cache file if cache option is disabled
		fileCache.destroy();
	}

	return globby(fileList, globbyOptions)
		.then((filePaths) => {
			// The ignorer filter needs to check paths relative to cwd
			filePaths = filterFilePaths(
				ignorer,
				filePaths.map((p) => path.relative(process.cwd(), p)),
			);

			if (!filePaths.length) {
				if (!allowEmptyInput) {
					throw new NoFilesFoundError(fileList);
				}

				return Promise.all([]);
			}

			const cwd = _.get(globbyOptions, 'cwd', process.cwd());
			let absoluteFilePaths = filePaths.map((filePath) => {
				const absoluteFilepath = !path.isAbsolute(filePath)
					? path.join(cwd, filePath)
					: path.normalize(filePath);

				return absoluteFilepath;
			});

			if (useCache) {
				absoluteFilePaths = absoluteFilePaths.filter(fileCache.hasFileChanged.bind(fileCache));
			}

			const getStylelintResults = absoluteFilePaths.map((absoluteFilepath) => {
				debug(`Processing ${absoluteFilepath}`);

				return stylelint
					._lintSource({
						filePath: absoluteFilepath,
					})
					.then((postcssResult) => {
						if (postcssResult.stylelint.stylelintError && useCache) {
							debug(`${absoluteFilepath} contains linting errors and will not be cached.`);
							fileCache.removeEntry(absoluteFilepath);
						}

						/**
						 * If we're fixing, save the file with changed code
						 * @type {Promise<Error | void>}
						 */
						let fixFile = Promise.resolve();

						if (
							postcssResult.root &&
							postcssResult.opts &&
							!postcssResult.stylelint.ignored &&
							options.fix &&
							!postcssResult.stylelint.disableWritingFix
						) {
							// @ts-ignore TODO TYPES toString accepts 0 arguments
							const fixedCss = postcssResult.root.toString(postcssResult.opts.syntax);

							if (
								postcssResult.root &&
								postcssResult.root.source &&
								// @ts-ignore TODO TYPES css is unknown property
								postcssResult.root.source.input.css !== fixedCss
							) {
								fixFile = writeFileAtomic(absoluteFilepath, fixedCss);
							}
						}

						return fixFile.then(() =>
							stylelint._createStylelintResult(postcssResult, absoluteFilepath),
						);
					})
					.catch((error) => {
						// On any error, we should not cache the lint result
						fileCache.removeEntry(absoluteFilepath);

						return handleError(stylelint, error, absoluteFilepath);
					});
			});

			return Promise.all(getStylelintResults);
		})
		.then((stylelintResults) => {
			if (useCache) {
				fileCache.reconcile();
			}

			const rtn = prepareReturnValue(stylelintResults, options, formatterFunction);

			debug(`Linting complete in ${Date.now() - startTime}ms`);

			return rtn;
		});
};

/**
 * @param {FormatterIdentifier | undefined} selected
 * @returns {Formatter}
 */
function getFormatterFunction(selected) {
	/** @type {Formatter} */
	let formatterFunction;

	if (typeof selected === 'string') {
		formatterFunction = formatters[selected];

		if (formatterFunction === undefined) {
			throw new Error(
				`You must use a valid formatter option: ${getFormatterOptionsText()} or a function`,
			);
		}
	} else if (typeof selected === 'function') {
		formatterFunction = selected;
	} else {
		formatterFunction = formatters.json;
	}

	return formatterFunction;
}

/**
 * @param {import('stylelint').StylelintInternalApi} stylelint
 * @param {any} error
 * @param {string} [filePath]
 * @return {Promise<StylelintResult>}
 */
function handleError(stylelint, error, filePath = undefined) {
	if (error.name === 'CssSyntaxError') {
		return createStylelintResult(stylelint, undefined, filePath, error);
	}

	throw error;
}
