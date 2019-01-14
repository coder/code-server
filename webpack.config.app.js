const path = require("path");

const environment = process.env.NODE_ENV || "development";
const isCi = typeof process.env.CI !== "undefined";
const minify = isCi;
const compatibility = isCi;

const HappyPack = require("happypack");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const root = __dirname;
const fills = path.join(root, "packages", "ide", "src", "fill");
const vscodeFills = path.join(root, "packages", "vscode", "src", "fill");

module.exports = {
	context: root,
	devtool: "eval",
	entry: "./packages/web/src/index.ts",
	mode: isCi ? "production" : "development",
	output: {
		chunkFilename: "[name]-[hash:6].bundle.js",
		path: path.join(root, "dist"),
		filename: "[hash:6].bundle.js",
	},
	module: {
		rules: [{
			test: /\.(js)/,
			exclude: /test/,
		}, {
			test: /\.(node|txt|d\.ts|test.ts|perf.data.js|jxs)/,
			use: [{
				loader: "ignore-loader",
			}],
		}, {
			use: [{
				loader: "happypack/loader?id=ts",
			}],
			test: /(^.?|\.[^d]|[^.]d|[^.][^d])\.tsx?$/,
		}, {
			exclude: /test/,
			test: /\.s?css$/,
			// This is required otherwise it'll fail to resolve CSS in common.
			include: root,
			use: [{
				loader: MiniCssExtractPlugin.loader,
			}, {
				loader: "css-loader",
			}, {
				loader: "sass-loader",
			}],
		}, {
			test: /\.(svg|png|ttf|woff|eot)$/,
			use: [{
				loader: "file-loader",
			}],
		}, {
			test: /\.wasm$/,
			type: "javascript/auto",
		}],
		noParse: /\.test\.(j|t)sx?/,
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

			"@coder": path.join(root, "packages"),
			"vs": path.join(root, "lib", "vscode", "src", "vs"),
		},
		extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".css"],
		mainFiles: [
			"index",
			"src/index",
		],
	},
	resolveLoader: {
		alias: {
			"vs/css": path.join(vscodeFills, "css.js"),
		},
		modules: [
			path.join(root, "node_modules"),
		],
	},
	devServer: {
		hot: true,
		port: 3000,
		disableHostCheck: true,
		stats: {
			all: false, // Fallback for options not defined.
			errors: true,
			warnings: true,
		},
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "packages/web/src/index.html",
		}),
		new HappyPack({
			id: "ts",
			threads: 2,
			loaders: [{
				path: "ts-loader",
				query: {
					happyPackMode: true,
				},
			}],
		}),
		// new BundleAnalyzerPlugin(),
		new WriteFilePlugin({
			exitOnErrors: false,
		}),
		new PreloadWebpackPlugin({
			rel: "preload",
			as: "script",
		}),
		new webpack.DefinePlugin({
			"process.env.NODE_ENV": `"${environment}"`,
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
		// minify ? new UglifyJsPlugin({
		// 	cache: true,
		// 	parallel: true,
		// 	sourceMap: false,
		// }) : undefined,
		// new ForkTsCheckerWebpackPlugin({
		// 	checkSyntacticErrors: true,
		// 	tsconfig: path.join(root, "./src/tsconfig.json"),
		// }),
	],
	target: "web",
	stats: {
		all: false, // Fallback for options not defined.
		errors: true,
		warnings: true,
	},
};
