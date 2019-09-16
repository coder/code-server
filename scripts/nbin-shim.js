// This file is prepended to loader/entry code (like our main.js or VS Code's
// bootstrap-fork.js). {{ROOT_PATH}} is replaced during the build process.
if (!global.NBIN_LOADED) {
	try {
		const nbin = require("nbin");
		nbin.shimNativeFs("{{ROOT_PATH}}");
		global.NBIN_LOADED = true;
		const path = require("path");
		const rg = require("vscode-ripgrep");
		rg.binaryRgPath = rg.rgPath;
		rg.rgPath = path.join(
			require("os").tmpdir(),
			`code-server/${path.basename(rg.binaryRgPath)}`
		);
	} catch (error) { /*  Not in the binary. */ }
}
