module.exports = function(source) {
	if (this.resourcePath.endsWith(".ts")) {
		this.resourcePath = this.resourcePath.replace(".ts", ".css");
	}
	return `module.exports = require("${this.resourcePath.replace(/\\/g, "\\\\")}");`;
};
