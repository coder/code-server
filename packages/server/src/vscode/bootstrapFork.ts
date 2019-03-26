import { field, logger } from "@coder/logger/src";
import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";
import * as zlib from "zlib";
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

/**
 * Called from forking a module
 */
export const requireFork = (modulePath: string, args: string[], builtInExtensionsDir: string): void => {
	const Module = require("module") as typeof import("module");
	const oldRequire = Module.prototype.require;
	// tslint:disable-next-line:no-any
	const oldLoad = (Module as any)._findPath;
	// @ts-ignore
	(Module as any)._findPath = function (request, parent, isMain): any {
		const lookupPaths = oldLoad.call(this, request, parent, isMain);

		return lookupPaths;
	};
	// tslint:disable-next-line:no-any
	Module.prototype.require = function (id: string): any {
		if (id === "typescript") {
			return require("typescript");
		}
		if (id === "vscode-chrome-debug-core") {
			return require("../../../../lib/VSCode-linux-x64/resources/app/extensions/ms-vscode.node-debug2/node_modules/vscode-chrome-debug-core");
		}
		if (id === "vscode-debugadapter") {
			return require("../../../../lib/VSCode-linux-x64/resources/app/extensions/ms-vscode.node-debug2/node_modules/vscode-debugadapter");
		}
		if (id === "vscode-nls") {
			return require("../../../../lib/VSCode-linux-x64/resources/app/extensions/ms-vscode.node-debug2/node_modules/vscode-nls");
		}

		// tslint:disable-next-line:no-any
		return oldRequire.call(this, id as any);
	};

	if (!process.send) {
		throw new Error("No IPC messaging initialized");
	}

	process.argv = ["", "", ...args];
	requireFilesystemModule(modulePath, builtInExtensionsDir);

	if (ipcMsgBuffer && ipcMsgListener) {
		process.removeListener("message", ipcMsgListener);
		// tslint:disable-next-line:no-any
		ipcMsgBuffer.forEach((i) => process.emit("message" as any, i as any));
		ipcMsgBuffer = undefined;
		ipcMsgListener = undefined;
	}
};

export const requireModule = (modulePath: string, dataDir: string, builtInExtensionsDir: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;
	const xml = require("xhr2");
	xml.XMLHttpRequest.prototype._restrictedHeaders["user-agent"] = false;
	// tslint:disable-next-line no-any this makes installing extensions work.
	(global as any).XMLHttpRequest = xml.XMLHttpRequest;

	const mod = require("module") as typeof import("module");
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
		/**
		 * Needed for properly forking external modules within the CLI
		 */
		// tslint:disable-next-line:no-any
		(<any>cp).fork = (modulePath: string, args: ReadonlyArray<string> = [], options?: cp.ForkOptions): cp.ChildProcess => {
			return cp.spawn(process.execPath, [path.join(buildDir, "out", "cli.js"), "--fork", modulePath, "--args", JSON.stringify(args), "--data-dir", dataDir], {
				...options,
				stdio: [null, null, null, "ipc"],
			});
		};
	}

	// let content: Buffer | undefined;
	// const readFile = (name: string): Buffer => {
	// 	return fs.readFileSync();
	// };
	const baseDir = path.join(buildDir, "build");
	if (isCli) {
		__non_webpack_require__(path.join(baseDir, "bootstrap-fork.js.gz"));
		// const rawFile = readFile("bootstrap-fork.js.gz");
		// content = zlib.gunzipSync(rawFile);
	} else {
		require("../../../vscode/out/bootstrap-fork.js");
		// content = readFile("../../vscode/out/bootstrap-fork.js");
	}
	// __non_webpack_require__(path.join(process.env.BUILD_DIR as string || path.join(__dirname, "../.."), "./build", isCli ? "bootstrap-fork.js.gz" : "bootstrap-fork.js"));
	// eval(content.toString());
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
	let proc: cp.ChildProcess;
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
		forkArgs.push("--args", JSON.stringify(args));
	}
	if (dataDir) {
		forkArgs.push("--data-dir", dataDir);
	}
	if (isCli) {
		proc = cp.spawn(process.execPath, [path.join(buildDir, "out", "cli.js"), ...forkArgs], forkOptions);
	} else {
		proc = cp.spawn(process.execPath, ["--require", "ts-node/register", "--require", "tsconfig-paths/register", process.argv[1], ...forkArgs], forkOptions);
	}

	return proc;
};
