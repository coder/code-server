'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const stringFormatter = require('./stringFormatter');

/**
 * @type {import('stylelint').Formatter}
 */
module.exports = function (results) {
	let output = stringFormatter(results);

	if (output === '') {
		output = '\n';
	}

	const sourceWord = results.length > 1 ? 'sources' : 'source';
	const ignoredCount = results.filter((result) => result.ignored).length;
	const checkedDisplay = ignoredCount
		? `${results.length - ignoredCount} of ${results.length}`
		: results.length;

	output += chalk.underline(`${checkedDisplay} ${sourceWord} checked\n`);
	results.forEach((result) => {
		let formatting = 'green';

		if (result.errored) {
			formatting = 'red';
		} else if (result.warnings.length) {
			formatting = 'yellow';
		} else if (result.ignored) {
			formatting = 'dim';
		}

		let sourceText = `${result.source}`;

		if (result.ignored) {
			sourceText += ' (ignored)';
		}

		output += _.get(chalk, formatting)(` ${sourceText}\n`);
	});

	const warnings = _.flatten(results.map((r) => r.warnings));
	const warningsBySeverity = _.groupBy(warnings, 'severity');
	const problemWord = warnings.length === 1 ? 'problem' : 'problems';

	output += chalk.underline(`\n${warnings.length} ${problemWord} found\n`);

	for (const [severityLevel, warningList] of Object.entries(warningsBySeverity)) {
		const warningsByRule = _.groupBy(warningList, 'rule');

		output += ` severity level "${severityLevel}": ${warningList.length}\n`;

		for (const [rule, list] of Object.entries(warningsByRule)) {
			output += chalk.dim(`  ${rule}: ${list.length}\n`);
		}
	}

	return `${output}\n`;
};
