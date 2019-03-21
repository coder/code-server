const path = require("path");
const os = require("os");
const environment = process.env.NODE_ENV || "development";
const HappyPack = require("happypack");
const webpack = require("webpack");

const root = path.join(__dirname, "..");

module.exports = (options = {}) => ({
	context: root,
	devtool: "none",
	externals: ["fsevents"],
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
					replace: "location.protocol + '//' + location.host + location.pathname.replace(/\\/$/,'') + '/' + require('!!file-loader?name=[path][name].[ext]!' + ",
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
			test: /\.node$/,
			use: "node-loader",
		}, {
			use: [{
				loader: "happypack/loader?id=ts",
			}],
			test: /(^.?|\.[^d]|[^.]d|[^.][^d])\.tsx?$/,
		}, {
			test: /\.wasm$/,
			type: "javascript/auto",
		}, {
			// Fixes spdlog.
			test: /spdlog(\\|\/)index\.js/,
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
			test: /@oclif(\\|\/)command(\\|\/)lib(\\|\/)index\.js/,
			loader: "string-replace-loader",
			options: {
				multiple: [{
					search: "checkNodeVersion\\(\\);",
					replace: "",
					flags: "g",
				}],
			},
		}, {
			test: /node\-pty\-prebuilt(\\|\/)lib(\\|\/)index\.js/,
			loader: "string-replace-loader",
			options: {
				multiple: [{
					search: "exports\\.native.*;",
					replace: "exports.native = null;",
					flags: "g",
				}],
			},
		}, {
			test: /node\-pty\-prebuilt(\\|\/)lib(\\|\/).*\.js/,
			loader: "string-replace-loader",
			options: {
				multiple: [{
					search: "var pty = .*pty\.node.*;",
					replace: "var pty = __non_webpack_require__(global.NODEPTY_LOCATION);",
					flags: "g",
				}],
			},
		}],
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
			threads: Math.max(os.cpus().length - 1, 1),
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
			"process.env.SERVICE_URL": `"${process.env.SERVICE_URL || ""}"`,
			"process.env.VERSION": `"${process.env.VERSION || ""}"`,
		}),
	],
	stats: {
		all: false, // Fallback for options not defined.
		errors: true,
		warnings: true,
	},
});
