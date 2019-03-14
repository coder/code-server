const webpack = require("webpack");
const path = require("path");
const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const root = path.join(__dirname, "..");
const prod = process.env.NODE_ENV === "production" || process.env.CI === "true";

module.exports = (options = {}) => merge(
	require("./webpack.general.config")(options), {
	devtool: prod ? "none" : "cheap-module-eval-source-map",
	mode: prod ? "production" : "development",
	entry: prod ? options.entry : [
		"webpack-hot-middleware/client?reload=true&quiet=true",
		options.entry,
	],
	module: {
		rules: [{
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
		}],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
		new HtmlWebpackPlugin({
			template: options.template,
		}),
		new PreloadWebpackPlugin({
			rel: "preload",
			as: "script",
		}),
	].concat(prod ? [] : [
		new webpack.HotModuleReplacementPlugin(),
	]),
	target: "web",
});
