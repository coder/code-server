const webpack = require("webpack");
const merge = require("webpack-merge");

module.exports = merge(require("./webpack.common.config.js"), {
	devtool: "cheap-module-eval-source-map",
	entry: [
		"webpack-hot-middleware/client?reload=true&quiet=true",
		"./packages/web/src/index.ts"
	],
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
	]
});
