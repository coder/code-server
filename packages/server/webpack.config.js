const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const StringReplacePlugin = require("string-replace-webpack-plugin");
const HappyPack = require("happypack");

module.exports = merge({
	devtool: "none",
	module: {
		rules: [
			{
				test: /@oclif\/command\/lib\/index\.js/,
				loader: StringReplacePlugin.replace({
					replacements: [
						{
							// This is required otherwise it attempts to require("package.json")
							pattern: /checkNodeVersion\(\)\;/,
							replacement: () => / /,
						}
					]
				}),
			},
		],
	},
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
	externals: ["node-pty", "spdlog"],
	entry: "./packages/server/src/cli.ts",
	target: "node",
	plugins: [
		new webpack.DefinePlugin({
			"process.env.BUILD_DIR": `"${__dirname}"`,
			"process.env.CLI": `"${process.env.CLI ? "true" : "false"}"`,
		}),
	],
}, require("../../scripts/webpack.general.config")(), {
	mode: "development",
});
