import * as tsConfig from "../../../tsconfig.json";
import * as tsConfigPaths from "tsconfig-paths";

// Prevent vscode from trying to load original-fs from electron.
delete process.env.ELECTRON_RUN_AS_NODE;

// This will advise Node so it can resolve paths based on our aliases.
tsConfigPaths.register({
	baseUrl: tsConfig.compilerOptions.baseUrl,
	paths: tsConfig.compilerOptions.paths,
});
