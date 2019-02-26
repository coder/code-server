const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const root = path.resolve(__dirname, "../../..");

module.exports = merge(
	require(path.join(root, "scripts/webpack.client.config.js"))({
		entry: path.join(root, "packages/app/browser/src/app.ts"),
		template: path.join(root, "packages/app/browser/src/app.html"),
	}), {
		output: {
			path: path.join(__dirname, "out"),
		},
	},
);
