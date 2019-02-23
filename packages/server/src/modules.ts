import * as fs from "fs";
import * as path from "path";
import { isCli, buildDir } from "./constants";

declare var __non_webpack_require__: typeof require;

/**
 * Handling of native modules within the CLI
 */
export const setup = (dataDirectory: string): void => {
	path.resolve(dataDirectory, "modules").split(path.sep).reduce((parentDir, childDir) => {
		const currentDir = path.join(parentDir, childDir);
		try {
			fs.mkdirSync(currentDir);
		} catch (ex) {
			if (ex.code !== "EEXIST") {
				throw ex;
			}
		}

		return currentDir;
	}, path.sep);

	const unpackModule = (moduleName: string): void => {
		const memFile = path.join(isCli ? buildDir! : path.join(__dirname, ".."), "build/modules", moduleName + ".node");
		const diskFile = path.join(dataDirectory, "modules", moduleName + ".node");
		if (!fs.existsSync(diskFile)) {
			fs.writeFileSync(diskFile, fs.readFileSync(memFile));
		}
	};

	/**
	 * We need to unpack node-pty and patch its `loadNative` function to require our unpacked pty.node
	 * If pty.node isn't unpacked a SIGSEGV is thrown and the application exits. The exact reasoning
	 * for this is unknown ATM, but this patch works around it.
	 */
	unpackModule("pty");
	unpackModule("spdlog");
	const nodePtyUtils = require("../../protocol/node_modules/node-pty/lib/utils") as typeof import("../../protocol/node_modules/node-pty/src/utils");
	// tslint:disable-next-line:no-any
	nodePtyUtils.loadNative = (modName: string): any => {
		return (typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require)(path.join(dataDirectory, "modules", modName + ".node"));
	};
	// tslint:disable-next-line:no-any
	(<any>global).SPDLOG_LOCATION = path.join(dataDirectory, "modules", "spdlog.node");
	// tslint:disable-next-line:no-unused-expression
	require("../../protocol/node_modules/node-pty/lib/index") as typeof import("../../protocol/node_modules/node-pty/src/index");
};
