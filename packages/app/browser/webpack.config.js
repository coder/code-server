const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const root = path.resolve(__dirname, "../../..");

module.exports = merge(
	require(path.join(root, "scripts/webpack.client.config.js"))({
		dirname: __dirname,
		entry: path.join(__dirname, "src/app.ts"),
		name: "login",
		template: path.join(__dirname, "src/app.html"),
	}), {
	},
);
