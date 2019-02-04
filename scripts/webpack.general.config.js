const path = require("path");
const environment = process.env.NODE_ENV || "development";
const isCi = typeof process.env.CI !== "undefined";
const HappyPack = require("happypack");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const root = path.join(__dirname, "..");

module.exports = (options = {}) => ({
	context: root,
	devtool: "source-map",
	// entry: "./packages/app/src/index.ts",
	mode: isCi ? "production" : "development",
	module: {
		rules: [{
			loader: "string-replace-loader",
			test: /\.(j|t)s/,
			options: {
				multiple: [{
					// These will be handled by file-loader. We need the location because
					// they are parsed as URIs and will throw errors if not fully formed.
					search: "require\\.toUrl\\(",
					replace: "location.protocol + '//' + location.host + '/' + require('file-loader?name=[path][name].[ext]!' + ",
					flags: "g",
				}, {
					search: "require\\.__\\$__nodeRequire",
					replace: "require",
					flags: "g",
				}, {
					search: "\\.attributes\\[([^\\]]+)\\] = ([^;]+)",
					replace: ".setAttribute($1, $2)",
					flags: "g",
				}],
			},
		}, {
			test: /\.(js)/,
			exclude: /test/,
		}, {
			test: /\.(txt|d\.ts|test.ts|perf.data.js|jxs|scpt|exe|sh|less)$/,
			use: [{
				loader: "ignore-loader",
			}],
		}, {
			// These are meant to run in separate pages, like the issue reporter or
			// process explorer. Ignoring for now since otherwise their CSS is
			// included in the main CSS.
			test: /electron-browser.+\.html$|code\/electron-browser\/.+\.css$/,
			use: [{
				loader: "ignore-loader",
			}],
		}, {
			test: /\.node$/,
			use: "node-loader",
		}, {
			use: [{
				loader: "happypack/loader?id=ts",
			}],
			test: /(^.?|\.[^d]|[^.]d|[^.][^d])\.tsx?$/,
		}, {
			// Test CSS isn't required. The rest is supposed to be served in separate
			// pages or iframes so we don't need to include it here.
			exclude: /test|code\/electron-browser\/.+\.css$/,
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
				options: {
					name: "[path][name].[ext]",
				},
			}],
		}, {
			test: /\.wasm$/,
			type: "javascript/auto",
		}],
		noParse: /\/test\/|\.test\.jsx?|\.test\.tsx?|tsconfig.+\.json$/,
	},
	resolve: {
		alias: {
			"@coder": path.join(root, "packages"),
		},
		extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".css"],
		mainFiles: [
			"index",
			"src/index",
		],
	},
	resolveLoader: {
		modules: [
			path.join(root, "node_modules"),
		],
	},
	plugins: [
		new HappyPack({
			id: "ts",
			threads: 10,
			loaders: [{
				path: "ts-loader",
				query: {
					happyPackMode: true,
					compilerOptions: options.typescriptCompilerOptions,
				},
			}],
		}),
		new webpack.DefinePlugin({
			"process.env.NODE_ENV": `"${environment}"`,
			"process.env.LOG_LEVEL": `"${process.env.LOG_LEVEL || ""}"`,
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
	],
	// target: "web",
	stats: {
		all: false, // Fallback for options not defined.
		errors: true,
		warnings: true,
	},
});
