const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");

const root = path.resolve(__dirname, "../..");

module.exports = merge(
	require(path.join(root, "scripts/webpack.node.config.js"))({
		// Config options.
	}), {
		module: {
			rules: [{
				test: /oniguruma(\\|\/)src(\\|\/).*\.js/,
				loader: "string-replace-loader",
				options: {
					multiple: [{
						search: "const Onig(.*) = .*onig_scanner\.node.*\.Onig(.*)",
						replace: "const Onig$1 = __non_webpack_require__(global.ONIG_LOCATION).Onig$2;",
						flags: "g",
					}],
				},
			}],
		},
		output: {
			filename: "cli.js",
			path: path.join(__dirname, "out"),
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
		resolve: {
			alias: {
				"node-pty": "node-pty-prebuilt",
			},
		},
		externals: ["tslib"],
		entry: "./packages/server/src/cli.ts",
		plugins: [
			new webpack.DefinePlugin({
				"process.env.BUILD_DIR": `"${__dirname.replace(/\\/g, "\\\\")}"`,
				"process.env.CLI": `"${process.env.CLI ? "true" : "false"}"`,
			}),
		],
	},
);
