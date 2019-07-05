if (!global.NBIN_LOADED) {
	try {
		const nbin = require("nbin");
		nbin.shimNativeFs("{{ROOT_PATH}}");
		global.NBIN_LOADED = true;
	} catch (error) {
		console.log("Not in the binary");
	}
}
