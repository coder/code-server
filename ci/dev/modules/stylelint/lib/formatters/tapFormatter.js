'use strict';

/**
 * @type {import('stylelint').Formatter}
 */
const tapFormatter = (results) => {
	let lines = [`TAP version 13\n1..${results.length}`];

	results.forEach((result, index) => {
		lines.push(
			`${result.errored ? 'not ok' : 'ok'} ${index + 1} - ${result.ignored ? 'ignored ' : ''}${
				result.source
			}`,
		);

		if (result.warnings.length > 0) {
			lines.push('---', 'messages:');

			result.warnings.forEach((warning) => {
				lines.push(
					` - message: "${warning.text}"`,
					`   severity: ${warning.severity}`,
					`   data:`,
					`     line: ${warning.line}`,
					`     column: ${warning.column}`,
					`     ruleId: ${warning.rule}`,
				);
			});

			lines.push('---');
		}
	});

	lines.push('');

	return lines.join('\n');
};

module.exports = tapFormatter;
