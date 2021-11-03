const path = require('path');

export default [
	{
		input: 'specificity.js',
		output: [
			{
				file: 'dist/specificity.mjs',
				format: 'es',
			},
			{
				file: 'dist/specificity.js',
				format: 'umd',
				name: 'SPECIFICITY',
			},
		],
	},
];