import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vm from "vm";
import { logger } from "@coder/logger";
import { buildDir, isCli } from "../constants";

let ipcMsgBuffer: Buffer[] | undefined = [];
let ipcMsgListener = process.send ? (d: Buffer): number => ipcMsgBuffer!.push(d) : undefined;
if (ipcMsgListener) {
	process.on("message", ipcMsgListener);
}

declare var __non_webpack_require__: typeof require;

/**
 * Requires a module from the filesystem.
 *
 * Will load from the CLI if file is included inside of the default extensions dir
 */
// tslint:disable-next-line:no-any
const requireFilesystemModule = (id: string, builtInExtensionsDir: string): any => {
	const mod = require("module") as typeof import("module");
	const customMod = new mod.Module(id);
	customMod.filename = id;
	// tslint:disable-next-line:no-any
	customMod.paths = (<any>mod)._nodeModulePaths(path.dirname(id));

	if (id.startsWith(builtInExtensionsDir)) {
		customMod.loaded = true;
		const fileName = id.endsWith(".js") ? id : `${id}.js`;
		const req = vm.runInThisContext(mod.wrap(fs.readFileSync(fileName).toString()), {
			displayErrors: true,
			filename: fileName,
		});
		req(customMod.exports, customMod.require.bind(customMod), customMod, fileName, path.dirname(id));

		return customMod.exports;
	}

	return customMod.require(id);
};

export const requireModule = (modulePath: string, builtInExtensionsDir: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;
	const xml = require("xhr2");
	xml.XMLHttpRequest.prototype._restrictedHeaders["user-agent"] = false;
	// tslint:disable-next-line no-any this makes installing extensions work.
	(global as any).XMLHttpRequest = xml.XMLHttpRequest;

	const promiseFinally = require("promise.prototype.finally") as { shim: () => void };
	promiseFinally.shim();
	/**
	 * Used for loading extensions. Using __non_webpack_require__ didn't work
	 * as it was not resolving to the FS.
	 */
	// tslint:disable-next-line:no-any
	(global as any).nativeNodeRequire = (id: string): any => {
		return requireFilesystemModule(id, builtInExtensionsDir);
	};

	if (isCli) {
		process.env.NBIN_BYPASS = "true";
	}

	const baseDir = path.join(buildDir, "build");
	if (isCli) {
		__non_webpack_require__(path.join(baseDir, "bootstrap-fork.js.gz"));
	} else {
		// We need to check `isCli` here to confuse webpack.
		require(path.join(__dirname, isCli ? "" : "../../../vscode/out/bootstrap-fork.js"));
	}
};

/**
 * Uses the internal bootstrap-fork.js to load a module
 * @example
 * const cp = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain");
 * cp.stdout.on("data", (data) => console.log(data.toString("utf8")));
 * cp.stderr.on("data", (data) => console.log(data.toString("utf8")));
 * @param modulePath Path of the VS Code module to load.
 */
export const forkModule = (modulePath: string, args?: string[], options?: cp.ForkOptions, dataDir?: string): cp.ChildProcess => {
	const forkOptions: cp.ForkOptions = {
		stdio: [null, null, null, "ipc"],
	};
	if (options && options.env) {
		// This prevents vscode from trying to load original-fs from electron.
		delete options.env.ELECTRON_RUN_AS_NODE;
		forkOptions.env = options.env;
	}

	const forkArgs = ["--bootstrap-fork", modulePath];
	if (args) {
		forkArgs.push("--extra-args", JSON.stringify(args));
	}
	if (dataDir) {
		forkArgs.push("--user-data-dir", dataDir);
	}

	const nodeArgs = [];
	if (isCli) {
		nodeArgs.push(path.join(buildDir, "out", "cli.js"));
	} else {
		nodeArgs.push(
			"--require", "ts-node/register",
			"--require", "tsconfig-paths/register",
			process.argv[1],
		);
	}

	const proc = cp.spawn(process.execPath, [...nodeArgs, ...forkArgs], forkOptions);
	if (args && args[0] === "--type=watcherService" && os.platform() === "linux") {
		cp.exec(`renice -n 19 -p ${proc.pid}`, (error) => {
			if (error) {
				logger.warn(error.message);
			}
		});
	}

	return proc;
};
