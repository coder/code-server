const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = merge(require("./webpack.common.config.js"), {
	devtool: "cheap-module-eval-source-map",
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
