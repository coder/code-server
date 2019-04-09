import { Binary } from "@coder/nbin";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const target = `${os.platform()}-${os.arch()}`;
const rootDir = path.join(__dirname, "..");
const bin = new Binary({
	mainFile: path.join(rootDir, "out", "cli.js"),
});
bin.writeFiles(path.join(rootDir, "build", "**"));
bin.writeFiles(path.join(rootDir, "out", "**"));
[
	// Native modules. These are marked as externals in the webpack config.
	"spdlog",
	"node-pty",

	// These are spdlog's dependencies.
	"mkdirp", "bindings",
].forEach((name) => {
	bin.writeModule(path.join(__dirname, "../../../node_modules", name));
});
bin.build().then((binaryData) => {
	const outputPath = path.join(__dirname, "..", `cli-${target}`);
	fs.writeFileSync(outputPath, binaryData);
	fs.chmodSync(outputPath, "755");
}).catch((ex) => {
	// tslint:disable-next-line:no-console
	console.error(ex);
	process.exit(1);
});
