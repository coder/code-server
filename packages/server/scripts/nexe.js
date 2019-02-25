const fs = require("fs");
const fse = require("fs-extra");
const os = require("os");
const path = require("path");

const nexePath = require.resolve("nexe");
const shimPath = path.join(path.dirname(nexePath), "lib/steps/shim.js");
let shimContent = fs.readFileSync(shimPath).toString();
const replaceString = `global.nativeFs = { readdir: originalReaddir, readdirSync: originalReaddirSync };`;
shimContent = shimContent.replace(/compiler\.options\.resources\.length[\s\S]*wrap\("(.*\\n)"/g, (om, a) => {
	return om.replace(a, `${a}${replaceString}`);
});
fs.writeFileSync(shimPath, shimContent);

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
