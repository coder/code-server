const merge = require("webpack-merge");

module.exports = (options = {}) => merge(
	require("./webpack.general.config")(options), {
	devtool: "none",
	mode: "production",
	target: "node",
});
