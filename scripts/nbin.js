/* global require, __dirname, process */
const { Binary } = require("@coder/nbin");
const fs = require("fs");
const path = require("path");

const target = process.argv[2];
const arch = process.argv[3];
const source = process.argv[4];

const bin = new Binary({
	mainFile: path.join(source, "out/vs/server/main.js"),
	target: target,
});

bin.writeFiles(path.join(source, "**"));

bin.build().then((binaryData) => {
	const outputPath = path.join(source, "code-server");
	fs.writeFileSync(outputPath, binaryData);
	fs.chmodSync(outputPath, "755");
}).catch((ex) => {
	console.error(ex);
	process.exit(1);
});
