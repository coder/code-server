import * as path from "path";

const rootPath = path.resolve(__dirname, "../../../..");

// tslint:disable-next-line no-any
if ((process.versions as any).nbin) {
	require("nbin").shimNativeFs(rootPath);
}

import * as tsConfigPaths from "tsconfig-paths";

// Prevent vscode from trying to load original-fs from electron.
delete process.env.ELECTRON_RUN_AS_NODE;

// This will advise Node so it can resolve paths based on our aliases.
tsConfigPaths.register({
	baseUrl: rootPath,
	paths: {
		"@coder/*": [
			"./out/packages/*/src",
		],
		"vs/*": [
			"./lib/vscode/out/vs/*",
		],
		electron: [
			"./out/packages/server/src/modules/electron",
		],
	},
});

if (!process.env.IS_FORK) {
	require("./cli");
}
