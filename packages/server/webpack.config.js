const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");

const root = path.resolve(__dirname, "../..");

module.exports = merge(
	require(path.join(root, "scripts/webpack.node.config.js"))({
		// Config options.
	}), {
		output: {
			filename: "cli.js",
			path: path.join(__dirname, "out"),
			libraryTarget: "commonjs",
		},
		mode: "production",
		node: {
			console: false,
			global: false,
			process: false,
			Buffer: false,
			__filename: false,
			__dirname: false,
			setImmediate: false
		},
		resolve: {
			alias: {
				"node-pty": "node-pty-prebuilt",
			},
		},
		externals: {
			"nbin": "commonjs nbin",
			"fsevents": "fsevents",
		},
		entry: "./packages/server/src/cli.ts",
		plugins: [
			new webpack.DefinePlugin({
				"process.env.BUILD_DIR": `"${__dirname.replace(/\\/g, "\\\\")}"`,
				"process.env.CLI": `"${process.env.CLI ? "true" : "false"}"`,
			}),
		],
	},
);
