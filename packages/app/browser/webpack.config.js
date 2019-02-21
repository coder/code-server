const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const prod = process.env.NODE_ENV === "production";

module.exports = merge(require(path.join(__dirname, "../../../scripts", "webpack.general.config.js"))(), {
	devtool: prod ? "source-map" : "cheap-module-eval-source-map",
	mode: prod ? "production" : "development",
	output: {
		path: path.join(__dirname, "out"),
	},
	entry: [
		"webpack-hot-middleware/client?reload=true&quiet=true",
		"./packages/app/browser/src/app.ts"
	],
	plugins: [
		new HtmlWebpackPlugin({
			template: "packages/app/browser/src/app.html",
		}),
		new webpack.HotModuleReplacementPlugin(),
		// new BundleAnalyzerPlugin(),
	]
});
