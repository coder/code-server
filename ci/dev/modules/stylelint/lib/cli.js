'use strict';

const chalk = require('chalk');
const checkInvalidCLIOptions = require('./utils/checkInvalidCLIOptions');
const EOL = require('os').EOL;
const getFormatterOptionsText = require('./utils/getFormatterOptionsText');
const getModulePath = require('./utils/getModulePath');
const getStdin = require('get-stdin');
const meow = require('meow');
const path = require('path');
const printConfig = require('./printConfig');
const resolveFrom = require('resolve-from');
const standalone = require('./standalone');
const writeOutputFile = require('./writeOutputFile');

const EXIT_CODE_ERROR = 2;

/**
 * @typedef {object} CLIFlags
 * @property {boolean} [cache]
 * @property {string} [cacheLocation]
 * @property {string | false} config
 * @property {string} [configBasedir]
 * @property {string} [customSyntax]
 * @property {string} [printConfig]
 * @property {string} [color]
 * @property {string} [customFormatter]
 * @property {boolean} [disableDefaultIgnores]
 * @property {boolean} [fix]
 * @property {string} [formatter="string"]
 * @property {string} [help]
 * @property {boolean} [ignoreDisables]
 * @property {string} [ignorePath]
 * @property {string[]} [ignorePattern]
 * @property {string} [noColor]
 * @property {string} [outputFile]
 * @property {boolean} [stdin]
 * @property {string} [stdinFilename]
 * @property {boolean} [reportNeedlessDisables]
 * @property {boolean} [reportInvalidScopeDisables]
 * @property {boolean} [reportDescriptionlessDisables]
 * @property {number} [maxWarnings]
 * @property {string | boolean} quiet
 * @property {string} [syntax]
 * @property {string} [version]
 * @property {boolean} [allowEmptyInput]
 */

/**
 * @typedef {object} CLIOptions
 * @property {any} input
 * @property {any} help
 * @property {any} pkg
 * @property {Function} showHelp
 * @property {Function} showVersion
 * @property {CLIFlags} flags
 */

/**
 * @typedef {object} OptionBaseType
 * @property {any} formatter
 * @property {boolean} [cache]
 * @property {string} [configFile]
 * @property {string} [cacheLocation]
 * @property {string} [customSyntax]
 * @property {string} [codeFilename]
 * @property {string} [configBasedir]
 * @property {{ quiet?: any }} configOverrides
 * @property {any} [printConfig]
 * @property {boolean} [fix]
 * @property {boolean} [ignoreDisables]
 * @property {any} [ignorePath]
 * @property {string} [outputFile]
 * @property {boolean} [reportNeedlessDisables]
 * @property {boolean} [reportInvalidScopeDisables]
 * @property {boolean} [reportDescriptionlessDisables]
 * @property {boolean} [disableDefaultIgnores]
 * @property {number} [maxWarnings]
 * @property {string} [syntax]
 * @property {string[]} [ignorePattern]
 * @property {boolean} [allowEmptyInput]
 * @property {string} [files]
 * @property {string} [code]
 */

const meowOptions = {
	autoHelp: false,
	autoVersion: false,
	help: `
    Usage: stylelint [input] [options]

    Input: Files(s), glob(s), or nothing to use stdin.

      If an input argument is wrapped in quotation marks, it will be passed to
      globby for cross-platform glob support. node_modules are always ignored.
      You can also pass no input and use stdin, instead.

    Options:

      --config

        Path to a specific configuration file (JSON, YAML, or CommonJS), or the
        name of a module in node_modules that points to one. If no --config
        argument is provided, stylelint will search for configuration files in
        the following places, in this order:
          - a stylelint property in package.json
          - a .stylelintrc file (with or without filename extension:
            .json, .yaml, .yml, and .js are available)
          - a stylelint.config.js file exporting a JS object
        The search will begin in the working directory and move up the directory
        tree until a configuration file is found.

      --config-basedir

        An absolute path to the directory that relative paths defining "extends"
        and "plugins" are *relative to*. Only necessary if these values are
        relative paths.

      --print-config

        Print the configuration for the given path.

      --ignore-path, -i

        Path to a file containing patterns that describe files to ignore. The
        path can be absolute or relative to process.cwd(). By default, stylelint
        looks for .stylelintignore in process.cwd().

      --ignore-pattern, --ip

        Pattern of files to ignore (in addition to those in .stylelintignore)

      --syntax, -s

        Specify a syntax. Options: "css", "css-in-js", "html", "less",
        "markdown", "sass", "scss", "sugarss". If you do not specify a syntax,
        syntaxes will be automatically inferred by the file extensions
        and file content.

      --fix

        Automatically fix violations of certain rules.

      --custom-syntax

        Module name or path to a JS file exporting a PostCSS-compatible syntax.

      --stdin

        Accept stdin input even if it is empty.

      --stdin-filename

        A filename to assign stdin input.

      --ignore-disables, --id

        Ignore styleline-disable comments.

      --disable-default-ignores, --di

        Allow linting of node_modules.

      --cache                       [default: false]

        Store the info about processed files in order to only operate on the
        changed ones the next time you run stylelint. By default, the cache
        is stored in "./.stylelintcache". To adjust this, use --cache-location.

      --cache-location              [default: '.stylelintcache']

        Path to a file or directory to be used for the cache location.
        Default is "./.stylelintcache". If a directory is specified, a cache
        file will be created inside the specified folder, with a name derived
        from a hash of the current working directory.

        If the directory for the cache does not exist, make sure you add a trailing "/"
        on *nix systems or "\\" on Windows. Otherwise the path will be assumed to be a file.

      --formatter, -f               [default: "string"]

        The output formatter: ${getFormatterOptionsText({ useOr: true })}.

      --custom-formatter

        Path to a JS file exporting a custom formatting function.

      --quiet, -q

        Only register violations for rules with an "error"-level severity (ignore
        "warning"-level).

      --color
      --no-color

        Force enabling/disabling of color.

      --report-needless-disables, --rd

        Also report errors for stylelint-disable comments that are not blocking a lint warning.
        The process will exit with code ${EXIT_CODE_ERROR} if needless disables are found.

      --report-invalid-scope-disables, --risd

        Report stylelint-disable comments that used for rules that don't exist within the configuration object.
        The process will exit with code ${EXIT_CODE_ERROR} if invalid scope disables are found.

      --report-descriptionless-disables, --rdd

        Report stylelint-disable comments without a description.
        The process will exit with code ${EXIT_CODE_ERROR} if descriptionless disables are found.

      --max-warnings, --mw

        Number of warnings above which the process will exit with code ${EXIT_CODE_ERROR}.
        Useful when setting "defaultSeverity" to "warning" and expecting the
        process to fail on warnings (e.g. CI build).

      --output-file, -o

        Path of file to write report.

      --version, -v

        Show the currently installed version of stylelint.

      --allow-empty-input, --aei

        When glob pattern matches no files, the process will exit without throwing an error.
	`,
	flags: {
		allowEmptyInput: {
			alias: 'aei',
			type: 'boolean',
		},
		cache: {
			type: 'boolean',
		},
		cacheLocation: {
			type: 'string',
		},
		color: {
			type: 'boolean',
		},
		config: {
			type: 'string',
		},
		configBasedir: {
			type: 'string',
		},
		customFormatter: {
			type: 'string',
		},
		customSyntax: {
			type: 'string',
		},
		disableDefaultIgnores: {
			alias: 'di',
			type: 'boolean',
		},
		fix: {
			type: 'boolean',
		},
		formatter: {
			alias: 'f',
			default: 'string',
			type: 'string',
		},
		help: {
			alias: 'h',
			type: 'boolean',
		},
		ignoreDisables: {
			alias: 'id',
			type: 'boolean',
		},
		ignorePath: {
			alias: 'i',
			type: 'string',
		},
		ignorePattern: {
			alias: 'ip',
			type: 'string',
			isMultiple: true,
		},
		maxWarnings: {
			alias: 'mw',
			type: 'number',
		},
		outputFile: {
			alias: 'o',
			type: 'string',
		},
		printConfig: {
			type: 'boolean',
		},
		quiet: {
			alias: 'q',
			type: 'boolean',
		},
		reportDescriptionlessDisables: {
			alias: 'rdd',
			type: 'boolean',
		},
		reportInvalidScopeDisables: {
			alias: 'risd',
			type: 'boolean',
		},
		reportNeedlessDisables: {
			alias: 'rd',
			type: 'boolean',
		},
		stdin: {
			type: 'boolean',
		},
		stdinFilename: {
			type: 'string',
		},
		syntax: {
			alias: 's',
			type: 'string',
		},
		version: {
			alias: 'v',
			type: 'boolean',
		},
	},
	pkg: require('../package.json'),
	argv: /** @type {string[]} */ ([]),
};

/**
 * @param {string[]} argv
 * @returns {Promise<any>}
 */
module.exports = (argv) => {
	const cli = buildCLI(argv);

	const invalidOptionsMessage = checkInvalidCLIOptions(meowOptions.flags, cli.flags);

	if (invalidOptionsMessage) {
		process.stderr.write(invalidOptionsMessage);
		process.exit(EXIT_CODE_ERROR); // eslint-disable-line no-process-exit
	}

	let formatter = cli.flags.formatter;

	if (cli.flags.customFormatter) {
		const customFormatter = path.isAbsolute(cli.flags.customFormatter)
			? cli.flags.customFormatter
			: path.join(process.cwd(), cli.flags.customFormatter);

		formatter = require(customFormatter);
	}

	/** @type {OptionBaseType} */
	const optionsBase = {
		formatter,
		configOverrides: {},
	};

	if (cli.flags.quiet) {
		optionsBase.configOverrides.quiet = cli.flags.quiet;
	}

	if (cli.flags.syntax) {
		optionsBase.syntax = cli.flags.syntax;
	}

	if (cli.flags.customSyntax) {
		optionsBase.customSyntax = getModulePath(process.cwd(), cli.flags.customSyntax);
	}

	if (cli.flags.config) {
		// Should check these possibilities:
		//   a. name of a node_module
		//   b. absolute path
		//   c. relative path relative to `process.cwd()`.
		// If none of the above work, we'll try a relative path starting
		// in `process.cwd()`.
		optionsBase.configFile =
			resolveFrom.silent(process.cwd(), cli.flags.config) ||
			path.join(process.cwd(), cli.flags.config);
	}

	if (cli.flags.configBasedir) {
		optionsBase.configBasedir = path.isAbsolute(cli.flags.configBasedir)
			? cli.flags.configBasedir
			: path.resolve(process.cwd(), cli.flags.configBasedir);
	}

	if (cli.flags.stdinFilename) {
		optionsBase.codeFilename = cli.flags.stdinFilename;
	}

	if (cli.flags.ignorePath) {
		optionsBase.ignorePath = cli.flags.ignorePath;
	}

	if (cli.flags.ignorePattern) {
		optionsBase.ignorePattern = cli.flags.ignorePattern;
	}

	if (cli.flags.ignoreDisables) {
		optionsBase.ignoreDisables = cli.flags.ignoreDisables;
	}

	if (cli.flags.disableDefaultIgnores) {
		optionsBase.disableDefaultIgnores = cli.flags.disableDefaultIgnores;
	}

	if (cli.flags.cache) {
		optionsBase.cache = true;
	}

	if (cli.flags.cacheLocation) {
		optionsBase.cacheLocation = cli.flags.cacheLocation;
	}

	if (cli.flags.fix) {
		optionsBase.fix = cli.flags.fix;
	}

	if (cli.flags.outputFile) {
		optionsBase.outputFile = cli.flags.outputFile;
	}

	const reportNeedlessDisables = cli.flags.reportNeedlessDisables;
	const reportInvalidScopeDisables = cli.flags.reportInvalidScopeDisables;
	const reportDescriptionlessDisables = cli.flags.reportDescriptionlessDisables;

	if (reportNeedlessDisables) {
		optionsBase.reportNeedlessDisables = reportNeedlessDisables;
	}

	if (reportInvalidScopeDisables) {
		optionsBase.reportInvalidScopeDisables = reportInvalidScopeDisables;
	}

	if (reportDescriptionlessDisables) {
		optionsBase.reportDescriptionlessDisables = reportDescriptionlessDisables;
	}

	const maxWarnings = cli.flags.maxWarnings;

	if (maxWarnings !== undefined) {
		optionsBase.maxWarnings = maxWarnings;
	}

	if (cli.flags.help) {
		cli.showHelp(0);

		return Promise.resolve();
	}

	if (cli.flags.version) {
		cli.showVersion();

		return Promise.resolve();
	}

	if (cli.flags.allowEmptyInput) {
		optionsBase.allowEmptyInput = cli.flags.allowEmptyInput;
	}

	return Promise.resolve()
		.then(
			/**
			 * @returns {Promise<OptionBaseType>}
			 */
			() => {
				// Add input/code into options
				if (cli.input.length) {
					return Promise.resolve({ ...optionsBase, files: /** @type {string} */ (cli.input) });
				}

				return getStdin().then((stdin) => ({ ...optionsBase, code: stdin }));
			},
		)
		.then((options) => {
			if (cli.flags.printConfig) {
				return printConfig(options)
					.then((config) => {
						process.stdout.write(JSON.stringify(config, null, '  '));
					})
					.catch(handleError);
			}

			if (!options.files && !options.code && !cli.flags.stdin) {
				cli.showHelp();

				return;
			}

			return standalone(options)
				.then((linted) => {
					if (!linted.output) {
						return;
					}

					process.stdout.write(linted.output);

					if (options.outputFile) {
						writeOutputFile(linted.output, options.outputFile).catch(handleError);
					}

					if (linted.errored) {
						process.exitCode = EXIT_CODE_ERROR;
					} else if (maxWarnings !== undefined && linted.maxWarningsExceeded) {
						const foundWarnings = linted.maxWarningsExceeded.foundWarnings;

						process.stderr.write(
							`${EOL}${chalk.red(`Max warnings exceeded: `)}${foundWarnings} found. ${chalk.dim(
								`${maxWarnings} allowed${EOL}${EOL}`,
							)}`,
						);
						process.exitCode = EXIT_CODE_ERROR;
					}
				})
				.catch(handleError);
		});
};

/**
 * @param {{ stack: any, code: any }} err
 * @returns {void}
 */
function handleError(err) {
	process.stderr.write(err.stack + EOL);
	const exitCode = typeof err.code === 'number' ? err.code : 1;

	process.exitCode = exitCode;
}

/**
 * @param {string[]} argv
 * @returns {CLIOptions}
 */
function buildCLI(argv) {
	// @ts-ignore TODO TYPES
	return meow({ ...meowOptions, argv });
}

module.exports.buildCLI = buildCLI;
