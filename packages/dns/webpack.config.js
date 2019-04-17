const path = require("path");
const merge = require("webpack-merge");

const root = path.resolve(__dirname, "../..");

module.exports = merge(
	require(path.join(root, "scripts/webpack.node.config.js"))({
		dirname: __dirname,
		name: "dns",
	}), {
		externals: {
			"node-named": "commonjs node-named",
		},
		entry: [
			"./packages/dns/src/dns.ts"
		],
	},
);
