try {
	const nbin = require("nbin");
	const path = require("path");
	const rootPath = path.resolve(__dirname, "../../..");
	console.log("Shimming", rootPath);
	nbin.shimNativeFs(rootPath);
} catch (error) {
	console.log("Not in the binary");
}

require("../../bootstrap-amd").load("vs/server/cli");
