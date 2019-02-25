const path = require("path");
const os = require("os");
const environment = process.env.NODE_ENV || "development";
const HappyPack = require("happypack");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const root = path.join(__dirname, "..");

module.exports = (options = {}) => ({
	context: root,
	devtool: "source-map",
	module: {
		rules: [{
			loader: "string-replace-loader",
			test: /\.(j|t)s/,
			options: {
				multiple: [{
					// These will be handled by file-loader. We need the location because
					// they are parsed as URIs and will throw errors if not fully formed.
					// The !! prefix causes it to ignore other loaders (doesn't work).
					search: "require\\.toUrl\\(",
					replace: "location.protocol + '//' + location.host + '/' + require('!!file-loader?name=[path][name].[ext]!' + ",
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
			test: /\.(js|css)/,
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
			test: /test|electron-browser.+\.html$|code\/electron-browser\/.+\.css$/,
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
			// pages or iframes so we don't need to include it here. Also excluding
			// markdown.css because even though it uses the file-loader as shown above
			// in the string replace, it's still making its way into the main CSS.
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
			test: /\.(svg|png|ttf|woff|eot|woff2)$/,
			use: [{
				loader: "file-loader",
				options: {
					name: "[path][name].[ext]",
				},
			}],
		}, {
			test: /\.wasm$/,
			type: "javascript/auto",
		}, {
			/**
			 * Fixes spdlog
			 */
			test: /spdlog\/index\.js/,
			loader: "string-replace-loader",
			options: {
				multiple: [{
					search: "const spdlog.*;",
					replace: "const spdlog = __non_webpack_require__(global.SPDLOG_LOCATION);",
					flags: "g",
				}],
			},
		}, {
			// This is required otherwise it attempts to require("package.json")
			test: /@oclif\/command\/lib\/index\.js/,
			loader: "string-replace-loader",
			options: {
				multiple: [{
					search: "checkNodeVersion\\(\\);",
					replace: "",
					flags: "g",
				}],
			},
		}, {
			test: /node\-pty\/lib\/index\.js/,
			loader: "string-replace-loader",
			options: {
				multiple: [{
					search: "exports\\.native.*;",
					replace: "exports.native = null;",
					flags: "g",
				}],
			},
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
			threads: os.cpus().length - 1,
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
