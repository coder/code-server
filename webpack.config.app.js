const path = require("path");

const sourcePath = "./src";
const entryFile = "./coder/entry.ts";
const isCi = typeof process.env.CI !== "undefined";
const environment = process.env.NODE_ENV || "development";
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

module.exports = {
	context: path.join(__dirname, sourcePath),
	devtool: "eval", // "cheap-module-eval-source-map",
	entry: entryFile,
	mode: isCi ? "production" : "development",
	output: {
		chunkFilename: "[name]-[hash:6].bundle.js",
		path: path.resolve(__dirname, "./dist"),
		publicPath: process.env.BUILD_ID ? `/${process.env.BUILD_ID}/ide/` : "/ide/",
		filename: "[hash:6].bundle.js",
		globalObject: "this",
	},
	module: {
		rules: [
			{
				loader: "string-replace-loader",
				test: /\.(js|ts)/,
				options: {
					multiple: [
						{
							search: "require\\.toUrl\\(",
							replace: "requireToUrl(",
							flags: "g",
						},
						{
							search: "require\\.__\\$__nodeRequire",
							replace: "require",
							flags: "g",
						},
					],
				},
			},
			{
				test: /\.(js)/,
				exclude: /test/,
			},
			{
				test: /\.(node|txt|d\.ts|test.ts|perf.data.js|jxs)/,
				loader: "ignore-loader",
			},
			{
				use: [{
					loader: "happypack/loader?id=ts",
				}],
				test: /(^.?|\.[^d]|[^.]d|[^.][^d])\.tsx?$/,
			}, {
				exclude: /test/,
				test: /\.s?css$/,
				// This is required otherwise it'll fail to resolve
				// CSS in common
				include: __dirname,
				use: [true ? {
					loader: MiniCssExtractPlugin.loader,
				} : "style-loader", require.resolve("css-loader"), require.resolve("sass-loader")],
			}, {
				test: /\.(svg|png|ttf|woff|eot)$/,
				use: ["file-loader"]
			}, {
				test: /\.wasm$/,
				type: "javascript/auto",
			}
		],
		noParse: /(\.test\.tsx?)|(\.test\.jsx?)/,
	},
	node: {
		// electron: "empty",
		// fs: "empty",
		// child_process: "empty",

		module: "empty",
		// net: "empty",
		crypto: "empty",
		tls: "empty",
	},
	resolve: {
		alias: {
			"gc-signals": path.resolve(__dirname, "./fill/empty.ts"),
			"native-keymap": path.resolve(__dirname, "./fill/native-keymap.ts"),
			"windows-process-tree": path.resolve(__dirname, "./fill/empty.ts"),
			"windows-mutex": path.resolve(__dirname, "./fill/empty.ts"),
			"selenium-webdriver": path.resolve(__dirname, "./fill/empty.ts"),
			"windows-foreground-love": path.resolve(__dirname, "./fill/empty.ts"),
			"vscode-fsevents": path.resolve(__dirname, "./fill/empty.ts"),
			"vsda": path.resolve(__dirname, "./fill/empty.ts"),
			"vscode": path.resolve(__dirname, "./fill/empty.ts"),
			"coder$": path.resolve(__dirname, "./fill/empty.ts"),

			"crypto": "crypto-browserify",
			"spdlog": path.resolve(__dirname, "./fill/spdlog.ts"),
			"child_process": path.resolve(__dirname, "./fill/child_process.ts"),
			"electron": path.resolve(__dirname, "./fill/electron.ts"),
			"fs": path.resolve(__dirname, "./fill/fs.ts"),
			"http": "http-browserify",
			"node-pty": path.resolve(__dirname, "./fill/node-pty.ts"),
			"os": "os-browserify",
			"net": path.resolve(__dirname, "./fill/net.ts"),
			"coder": path.resolve(__dirname, "./src/coder"),
			"vs": path.resolve(__dirname, "./src/vs"),
			"util": path.resolve(__dirname, "./node_modules/util"),
			"@coder": path.resolve(__dirname, "../../"),
		},
		extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".css"],
		mainFiles: [
			"index",
			"src/index",
		],
		modules: [
			path.resolve(__dirname, "./node_modules"),
			"../node_modules",
			path.resolve(__dirname, "../../../"),
		],
	},
	resolveLoader: {
		alias: {
			"vs/css": path.resolve(__dirname, "./fill/css.js"),
		},
		modules: [
			path.resolve(__dirname, "./node_modules"),
		],
	},
	devServer: {
		contentBase: sourcePath,
		compress: true,
		host: "0.0.0.0",
		hot: true,
		historyApiFallback: true,
		port: 9966,
		inline: true,
		disableHostCheck: true,
		stats: {
			warnings: false
		},
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./index.html",
		}),
		new HappyPack({
			id: "ts",
			threads: 2,
			loaders: [
				{
					path: "ts-loader",
					query: {
						happyPackMode: true,
					},
				}
			],
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
			'process.env.NODE_ENV': `"${environment}"`,
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
		// 	tsconfig: path.resolve(__dirname, "./src/tsconfig.json"),
		// }),
	],
	target: "web",
};
