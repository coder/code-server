const path = require("path");
const merge = require("webpack-merge");

module.exports = merge(require(path.join(__dirname, "../../scripts", "webpack.general.config.js"))(), {
	devtool: "none",
	mode: "production",
	target: "node",
	output: {
		path: path.join(__dirname, "out"),
		filename: "main.js",
		libraryTarget: "commonjs",
	},
	entry: [
		"./packages/logger/src/index.ts"
	],
});
