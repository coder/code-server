const { Binary } = require("@coder/nbin");
const fs = require("fs");
const path = require("path");

const source = process.argv[2];
const target = process.argv[3];
const binaryName = process.argv[4];

const bin = new Binary({
	mainFile: path.join(source, "out/vs/server/main.js"),
	target: target,
});

bin.writeFiles(path.join(source, "**"));

bin.build().then((binaryData) => {
	const outputPath = path.join(source, binaryName);
	fs.writeFileSync(outputPath, binaryData);
	fs.chmodSync(outputPath, "755");
}).catch((ex) => {
	console.error(ex);
	process.exit(1);
});
