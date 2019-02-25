const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");

module.exports = merge({
	devtool: "none",
	mode: "development",
	output: {
		filename: "cli.js",
		path: path.join(__dirname, "./out"),
		libraryTarget: "commonjs",
	},
	node: {
		console: false,
		global: false,
		process: false,
		Buffer: false,
		__filename: false,
		__dirname: false,
		setImmediate: false
	},
	externals: ["tslib", "trash"],
	entry: "./packages/server/src/cli.ts",
	target: "node",
	plugins: [
		new webpack.DefinePlugin({
			"process.env.BUILD_DIR": `"${__dirname}"`,
			"process.env.CLI": `"${process.env.CLI ? "true" : "false"}"`,
		}),
	],
}, require("../../scripts/webpack.general.config")());
