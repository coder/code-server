import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { isCli, buildDir } from "./constants";

/**
 * Handling of native modules within the CLI
 */
export const setup = (dataDirectory: string): void => {
	path.resolve(dataDirectory, "dependencies").split(path.sep).reduce((parentDir, childDir) => {
		const currentDir = path.join(parentDir, childDir);
		try {
			fs.mkdirSync(currentDir);
		} catch (ex) {
			if (ex.code !== "EEXIST" && ex.code !== "EISDIR" && ex.code !== "ENOENT") {
				throw ex;
			}
		}

		return currentDir;
	}, os.platform() === "win32" ? undefined! : path.sep); // Might need path.sep here for linux. Having it for windows causes an error because \C:\Users ...

	const unpackModule = (moduleName: string, markExecutable: boolean = false): void => {
		const memFile = path.join(isCli ? buildDir! : path.join(__dirname, ".."), "build/dependencies", moduleName);
		const diskFile = path.join(dataDirectory, "dependencies", moduleName);
		if (!fs.existsSync(diskFile)) {
			fs.writeFileSync(diskFile, fs.readFileSync(memFile));
		}
		if (markExecutable) {
			fs.chmodSync(diskFile, "755");
		}
	};

	/**
	 * We need to unpack node-pty and patch its `loadNative` function to require our unpacked pty.node
	 * If pty.node isn't unpacked a SIGSEGV is thrown and the application exits. The exact reasoning
	 * for this is unknown ATM, but this patch works around it.
	 */
	unpackModule("pty.node");
	unpackModule("spdlog.node");
	unpackModule("rg", true);
	// const nodePtyUtils = require("../../protocol/node_modules/node-pty-prebuilt/lib/utils") as typeof import("../../protocol/node_modules/node-pty-prebuilt/src/utils");
	// tslint:disable-next-line:no-any
	// nodePtyUtils.loadNative = (modName: string): any => {
	// 	return (typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require)(path.join(dataDirectory, "dependencies", modName + ".node"));
	// };
	(<any>global).RIPGREP_LOCATION = path.join(dataDirectory, "dependencies", "rg");
	(<any>global).NODEPTY_LOCATION = path.join(dataDirectory, "dependencies", "pty.node");
	// tslint:disable-next-line:no-any
	(<any>global).SPDLOG_LOCATION = path.join(dataDirectory, "dependencies", "spdlog.node");
	// tslint:disable-next-line:no-unused-expression
	require("../../protocol/node_modules/node-pty-prebuilt/lib/index") as typeof import("../../protocol/node_modules/node-pty-prebuilt/src/index");
};
