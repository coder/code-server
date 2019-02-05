const fs = require("fs");
const fse = require("fs-extra");
const os = require("os");
const path = require("path");
const nexe = require("nexe");
const zlib = require("zlib");

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

const tmpDir = path.join(__dirname, "../build");
if (fs.existsSync(tmpDir)) {
	console.log("Removing old build dir...");
	fse.removeSync(tmpDir);
}

console.log("Copying build files...");
fse.copySync(path.join(__dirname, "../resources"), tmpDir, {
	recursive: true,
});
const modDir = path.join(tmpDir, "modules");
fs.mkdirSync(modDir);
fse.copySync(path.join(__dirname, "../../protocol/node_modules/node-pty/build/Release/pty.node"), path.join(modDir, "pty.node"));

const zipper = (p) => {
	const stat = fs.statSync(p);
	if (!stat.isDirectory()) {
		fs.writeFileSync(p + ".gz", zlib.gzipSync(fs.readFileSync(p)));
		fse.removeSync(p);
		return;
	}
	const files = fs.readdirSync(p);
	files.forEach((f) => zipper(path.join(p, f)));
};

zipper(path.join(tmpDir, "web"));
zipper(path.join(tmpDir, "bootstrap-fork.js"));

nexe.compile({
	debugBundle: true,
	input: path.join(__dirname, "../out/cli.js"),
	output: 'cli',
	targets: ["linux"],
	native: {
		spdlog: {
			additionalFiles: [
				'spdlog.node'
			],
		},
	},
	/**
	 * To include native extensions, do NOT install node_modules for each one. They
	 * are not required as each extension is built using webpack.
	 */
	resources: [
		path.join(__dirname, "../package.json"),
		path.join(__dirname, "../build/**/*"),
	],
});
