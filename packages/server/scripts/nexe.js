const fs = require("fs");
const os = require("os");
const path = require("path");
const nexe = require("nexe");

const nexeRoot = path.join(os.homedir(), ".nexe");
if (!fs.existsSync(nexeRoot)) {
	throw new Error("run nexe manually on a binary to initialize it");
}
const listed = fs.readdirSync(nexeRoot);
listed.forEach((list) => {
	if (list.startsWith("linux")) {
		const stat = fs.statSync(path.join(nexeRoot, list));
		if (stat.isFile()) {
			if (stat.size > 20000000) {
				throw new Error("must use upx to shrink node binary in ~/.nexe/" + list);
			}
		}
	}
});

nexe.compile({
	debugBundle: true,
	input: path.join(__dirname, "../out/cli.js"),
	output: 'cli',
	native: {
		"node-pty": {
			additionalFiles: [
				'./node_modules/node-pty/build/Release/pty',
			],
		}
	},
	targets: ["linux"],
	/**
	 * To include native extensions, do NOT install node_modules for each one. They
	 * are not required as each extension is built using webpack.
	 */
	resources: [path.join(__dirname, "../package.json")],
});

/**
 * Notes for tmrw
 * 
 * `upx ~/.nexe/linux` <- node binary before compiling with nexe
 * Use `testing.js` for bundling with nexe to build 
 */