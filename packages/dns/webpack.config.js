const path = require("path");
const merge = require("webpack-merge");

const root = path.resolve(__dirname, "../..");

module.exports = merge(
	require(path.join(root, "scripts/webpack.node.config.js"))({
		// Options.
	}), {
		externals: {
			"node-named": "commonjs node-named",
		},
		output: {
			path: path.join(__dirname, "out"),
			filename: "main.js",
		},
		entry: [
			"./packages/dns/src/dns.ts"
		],
	},
);
