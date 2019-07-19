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
