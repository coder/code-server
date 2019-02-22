const fs = require("fs");
const fse = require("fs-extra");
const os = require("os");
const path = require("path");
const nexe = require("nexe");

nexe.compile({
	debugBundle: true,
	input: path.join(__dirname, "../out/cli.js"),
	output: `cli-${process.env.TRAVIS_OS_NAME || os.platform()}`,
	targets: [os.platform()],
	/**
	 * To include native extensions, do NOT install node_modules for each one. They
	 * are not required as each extension is built using webpack.
	 */
	resources: [
		path.join(__dirname, "../package.json"),
		path.join(__dirname, "../build/**/*"),
	],
});
