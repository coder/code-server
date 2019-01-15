const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const WriteFilePlugin = require("write-file-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const root = __dirname;
const fills = path.join(root, "packages", "ide", "src", "fill");
const vscodeFills = path.join(root, "packages", "vscode", "src", "fill");

const merge = require("webpack-merge");

module.exports = merge({
	devtool: "eval",
	entry: "./packages/web/src/index.ts",
	output: {
		chunkFilename: "[name]-[hash:6].bundle.js",
		path: path.join(root, "dist"),
		filename: "[hash:6].bundle.js",
	},
	resolve: {
		alias: {
			"native-keymap": path.join(vscodeFills, "native-keymap.ts"),
			"node-pty": path.join(vscodeFills, "node-pty.ts"),

			"gc-signals": path.join(fills, "empty.ts"),
			"selenium-webdriver": path.join(fills, "empty.ts"),
			"vscode": path.join(fills, "empty.ts"),
			"vscode-fsevents": path.join(fills, "empty.ts"),
			"vsda": path.join(fills, "empty.ts"),
			"windows-foreground-love": path.join(fills, "empty.ts"),
			"windows-mutex": path.join(fills, "empty.ts"),
			"windows-process-tree": path.join(fills, "empty.ts"),

			"crypto": "crypto-browserify",
			"http": "http-browserify",
			"os": "os-browserify",

			"child_process": path.join(fills, "child_process.ts"),
			"fs": path.join(fills, "fs.ts"),
			"net": path.join(fills, "net.ts"),
			"util": path.join(fills, "util.ts"),

			"electron": path.join(fills, "electron.ts"),

			"vs": path.join(root, "lib", "vscode", "src", "vs"),
		},
	},
	resolveLoader: {
		alias: {
			"vs/css": path.join(vscodeFills, "css.js"),
		},
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "packages/web/src/index.html",
		}),
		new PreloadWebpackPlugin({
			rel: "preload",
			as: "script",
		}),
		new WriteFilePlugin({
			exitOnErrors: false,
		}),
	],
	target: "web",
}, require("./scripts/webpack.general.config.js"));
