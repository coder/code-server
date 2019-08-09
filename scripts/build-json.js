// This builds the package and product JSON files for the final build.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const rootPath = path.resolve(__dirname, "..");
const sourcePath = process.argv[2];
const buildPath = process.argv[3];
const vscodeVersion = process.argv[4];
const codeServerVersion = process.argv[5];
const util = require(path.join(sourcePath, "build/lib/util"));

function computeChecksum(filename) {
	return crypto.createHash("md5").update(fs.readFileSync(filename))
		.digest("base64").replace(/=+$/, "");
}

const computeChecksums = (filenames) => {
	const result = {};
	filenames.forEach(function (filename) {
		result[filename] = computeChecksum(path.join(buildPath, "out", filename));
	});
	return result;
};

const mergeAndWrite = (name, json = {}) => {
	const aJson = JSON.parse(fs.readFileSync(path.join(sourcePath, `${name}.json`)));
	const bJson = JSON.parse(fs.readFileSync(path.join(rootPath, "scripts", `${name}.json`)));

	delete aJson.scripts;
	delete aJson.dependencies;
	delete aJson.devDependencies;
	delete aJson.optionalDependencies;

	fs.writeFileSync(path.join(buildPath, `${name}.json`), JSON.stringify({
		...aJson,
		...bJson,
		...json,
	}, null, 2));
};


const writeProduct = () => {
	const checksums = computeChecksums([
		"vs/workbench/workbench.web.api.js",
		"vs/workbench/workbench.web.api.css",
		"vs/code/browser/workbench/workbench.html",
		"vs/code/browser/workbench/workbench.js",
		"vs/server/src/cli.js",
		"vs/server/src/uriTransformer.js",
		"vs/server/src/login/index.html"
	]);
	const date = new Date().toISOString();
	const commit = util.getVersion(rootPath);
	mergeAndWrite("product", { commit, date, checksums });
	mergeAndWrite("package", { codeServerVersion: `${codeServerVersion}-vsc${vscodeVersion}` });
};

writeProduct();
