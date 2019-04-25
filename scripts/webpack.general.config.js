const path = require("path");
const os = require("os");
const environment = process.env.NODE_ENV || "development";
const HappyPack = require("happypack");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

const root = path.join(__dirname, "..");

module.exports = (options = {}) => ({
	context: root,
	devtool: "none",
	externals: {
		fsevents: "fsevents",
	},
	output: {
		path: path.join(options.dirname || __dirname, "out"),
		chunkFilename: `${options.name || "general"}.[name].[hash:6].js`,
		filename: `${options.name || "general"}.[name].[hash:6].js`
	},
	module: {
		rules: [{
			loader: "string-replace-loader",
			test: /\.(j|t)s/,
			options: {
				multiple: [{
					// These will be handled by file-loader. Must be a fully formed URI.
					// The !! prefix causes it to ignore other loaders.
					search: "require\\.toUrl\\(",
					replace: `${
						options.node
							? "'file://'"
							: "location.protocol + '//' + location.host + location.pathname.replace(/\\/$/,'')"
					} + '/' + require('!!file-loader?name=[path][name].[ext]!' + `,
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
				path: "cache-loader",
				query: {
					cacheDirectory: path.join(__dirname, "..", ".cache"),
				},
			}, {
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
	optimization: {
		minimizer: [
			new TerserPlugin({
				cache: path.join(__dirname, "..", ".cache", "terser"),
				parallel: true,
			}),
		],
	},
	stats: {
		all: false, // Fallback for options not defined.
		errors: true,
		warnings: true,
	},
});
