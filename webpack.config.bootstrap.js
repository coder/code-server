const path = require("path");

const sourcePath = "./src";
const entryFile = "./bootstrap-fork.js";
const minify = false;
const HappyPack = require("happypack");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = (env) => {
	const afterCompileCommand = env && env.afterCompileCommand;
	return {
		context: path.join(__dirname, sourcePath),
		entry: entryFile,
		mode: minify ? "production" : "development",
		target: "node",
		output: {
			chunkFilename: "[name].bundle.js",
			path: path.resolve(__dirname, "./bin"),
			publicPath: "/",
			filename: "entry.bundle.js",
			// libraryTarget: "amd",
			globalObject: "this",
		},
		module: {
			rules: [{
				loader: "string-replace-loader",
				test: /\.(js|ts)$/,
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
			}, {
				use: [{
					loader: "happypack/loader?id=ts",
				}],
				test: /(^.?|\.[^d]|[^.]d|[^.][^d])\.tsx?$/,
			}, {
				test: /\.s?css$/,
				use: [{
					loader: "style-loader",
				}, {
					loader: "css-loader",
				}],
			}, {
				test: /\.(svg|png|ttf|woff|eot)$/,
				use: ["file-loader"]
			}, {
				test: /\.wasm$/,
				type: "javascript/auto",
			}, {
				// Ignore a bunch of file types we don't have loaders for. Also ignore
				// test directories, some files with invalid JSON, and files we don't
				// actually require but throw warnings or errors. This all seems to be a
				// case of dynamic loading including things we won't require.
				// This also results in the bundle being significantly smaller which
				// makes uglify much faster.
				test: /(\/vs\/code\/electron-main\/)|(\/test\/)|(OSSREADME\.json$)|(\.(test\.ts|test\.js|d\.ts|qwoff|node|html|txt|exe|wuff|md|sh|scpt|less)$)/,
				use: ["ignore-loader"]
			}],
		},
		// node: {
		// 	// electron: "empty",
		// 	// fs: "empty",
		// 	// child_process: "empty",

		// 	module: "empty",
		// 	// net: "empty",
		// 	crypto: "empty",
		// 	tls: "empty",
		// },
		// externals: [
		// 	function(context, request, callback) {
		// 		process.stderr.write("requiring external " + request + "\n");
		// 		callback();
		// 	},
		// ],
		resolve: {
			alias: {
				"gc-signals": path.resolve(__dirname, "./fill/empty.ts"),
				"native-keymap": path.resolve(__dirname, "./fill/native-keymap.ts"),
				"windows-process-tree": path.resolve(__dirname, "./fill/empty.ts"),
				"electron": path.resolve(__dirname, "./fill/electron.ts"),
				// "crypto": "crypto-browserify",
				// "child_process": path.resolve(__dirname, "./fill/child_process.ts"),
				// "fs": path.resolve(__dirname, "./fill/fs.ts"),
				// "http": "http-browserify",
				// "node-pty": path.resolve(__dirname, "./fill/node-pty.ts"),
				// "os": "os-browserify",
				// "net": path.resolve(__dirname, "./fill/net.ts"),
				// TODO: The real spdlog doesn't work and keeps saying the path argument is undefined.
				"spdlog": path.resolve(__dirname, "./fill/spdlog.ts"),
				"coder": path.resolve(__dirname, "./src/coder"),
				"vs": path.resolve(__dirname, "./src/vs"),
			},
			extensions: [".js", ".ts", ".json", ".css"],
			mainFiles: [
				"index",
				"src/index",
			],
			modules: [
				"../node_modules",
				path.resolve(__dirname, "../../../"),
			],
		},
		resolveLoader: {
			alias: {
				"vs/css": path.resolve(__dirname, "./fill/css.js"),
			},
		},
		// devServer: {
		// 	contentBase: sourcePath,
		// 	compress: true,
		// 	host: "0.0.0.0",
		// 	hot: true,
		// 	historyApiFallback: true,
		// 	port: 9966,
		// 	inline: true,
		// 	disableHostCheck: true,
		// 	stats: {
		// 		warnings: false
		// 	},
		// },
		plugins: [
			// new HtmlWebpackPlugin({
			// 	template: "./index.html",
			// }),
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
			new webpack.ProgressPlugin((percentage, msg) => {
				if (percentage === 1) {
					if (afterCompileCommand) {
						require("child_process").execSync(afterCompileCommand, {
							stdio: "inherit"
						});
					}
				}
			}),
			// new UglifyJsPlugin(),
			// new BundleAnalyzerPlugin(),
			// new WriteFilePlugin({
			// 	exitOnErrors: false,
			// }),
			// new PreloadWebpackPlugin({
			// 	rel: "preload",
			// 	as: "script",
			// }),
			// new ForkTsCheckerWebpackPlugin({
			// 	checkSyntacticErrors: true,
			// 	tsconfig: path.resolve(__dirname, "./src/tsconfig.json"),
			// }),
		],
		stats: {
			all: false, // Fallback for options not defined.
			errors: true,
			warnings: true,
		},
	};
};
