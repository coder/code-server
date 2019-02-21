const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const prod = process.env.NODE_ENV === "production";

module.exports = [
	merge(require(path.join(__dirname, "../../../scripts", "webpack.general.config.js"))(), {
		devtool: "none",
		mode: "development",
		target: "web",
		output: {
			path: path.join(__dirname, "out"),
			filename: "background.js",
		},
		entry: [
			"./packages/app/chrome/src/background.ts"
		],
		plugins: [
		]
	}),
	merge(require(path.join(__dirname, "../../../scripts", "webpack.general.config.js"))(), {
		devtool: "none",
		mode: "development",
		target: "web",
		output: {
			path: path.join(__dirname, "out"),
			filename: "content.js",
		},
		entry: [
			"./packages/app/chrome/src/content.ts"
		],
		plugins: [
		]
	}),
];
