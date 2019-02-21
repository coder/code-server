const path = require("path");
const merge = require("webpack-merge");

module.exports = merge(require(path.join(__dirname, "../../scripts", "webpack.general.config.js"))(), {
	devtool: "none",
	mode: "production",
	target: "node",
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
});
