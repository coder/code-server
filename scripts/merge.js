// This is used to merge JSON files (package.json and product.json) and delete a
// few entries we don't want. It's extremely simple, expects very specific
// input, and doesn't have any error handling.
const fs = require("fs");

const a = process.argv[2];
const b = process.argv[3];
const out = process.argv[4];
const json = JSON.parse(process.argv[5] || "{}");

const aJson = JSON.parse(fs.readFileSync(a));
const bJson = JSON.parse(fs.readFileSync(b));

delete aJson.scripts;
delete aJson.dependencies;
delete aJson.devDependencies;
delete aJson.optionalDependencies;

fs.writeFileSync(out, JSON.stringify({
	...aJson,
	...bJson,
	...json,
}, null, 2));
