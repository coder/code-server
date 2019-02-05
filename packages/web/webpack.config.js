const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const prod = process.env.NODE_ENV === "production";

module.exports = merge(require("./webpack.common.config.js"), {
	devtool: prod ? "source-map" : "cheap-module-eval-source-map",
	mode: prod ? "production" : "development",
	output: {
		path: path.join(__dirname, "out"),
	},
	entry: [
		"webpack-hot-middleware/client?reload=true&quiet=true",
		"./packages/web/src/index.ts"
	],
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		// new BundleAnalyzerPlugin(),
	]
});
