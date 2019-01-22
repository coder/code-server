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
			test: /\.(js)/,
			exclude: /test/,
		}, {
			test: /\.(txt|d\.ts|test.ts|perf.data.js|jxs|md|scpt|exe|sh|less)$/,
			use: [{
				loader: "ignore-loader",
			}],
		}, {
			test: /electron-browser.+\.html$/,
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
			threads: 2,
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
