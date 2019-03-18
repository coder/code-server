import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import * as vm from "vm";
import { isCli } from "../constants";

let ipcMsgBuffer: Buffer[] | undefined = [];
let ipcMsgListener = process.send ? (d: Buffer): number => ipcMsgBuffer!.push(d) : undefined;
if (ipcMsgListener) {
	process.on("message", ipcMsgListener);
}

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
			filename: id + fileName,
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
	Module.prototype.require = (id: string): any => {
		if (id === "typescript") {
			return require("typescript");
		}

		return oldRequire(id);
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

	/**
	 * A list of native packages that could be expected to
	 * exist in the unpacked version of VS Code. This list may
	 * grow in the future.
	 */
	// tslint:disable-next-line:no-any
	const nativeModules: ReadonlyArray<{ id: string, module: any }> = [
		{ id: "vscode-textmate", module: require("../../../../lib/vscode/node_modules/vscode-textmate") as typeof import("../../../../lib/vscode/node_modules/vscode-textmate") },
	];
	const oldRequire = mod.prototype.require;
	// tslint:disable-next-line:no-any
	mod.prototype.require = function (id: string): any {
		if (id.slice(0, 3) === "/./") {
			for (let i = 0; i < nativeModules.length; i++) {
				if (id.slice(-1 * (nativeModules[i].id.length + 1)) !== `/${nativeModules[i].id}`) {
					continue;
				}

				return nativeModules[i].module;
			}
			throw new Error(`Module '${id}' undefined. If you need this native module, file an issue on GitHub.`);
		}

		// tslint:disable-next-line:no-any
		return oldRequire.call(this, id as any);
	};

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
			return cp.spawn(process.execPath, ["--fork", modulePath, "--args", JSON.stringify(args), "--data-dir", dataDir], {
				...options,
				stdio: [null, null, null, "ipc"],
			});
		};
	}

	let content: Buffer | undefined;
	const readFile = (name: string): Buffer => {
		return fs.readFileSync(path.join(process.env.BUILD_DIR as string || path.join(__dirname, "../.."), "./build", name));
	};
	if (isCli) {
		content = zlib.gunzipSync(readFile("bootstrap-fork.js.gz"));
	} else {
		content = readFile("../../vscode/out/bootstrap-fork.js");
	}
	eval(content.toString());
};

/**
 * Uses the internal bootstrap-fork.js to load a module
 * @example
 * const cp = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain");
 * cp.stdout.on("data", (data) => console.log(data.toString("utf8")));
 * cp.stderr.on("data", (data) => console.log(data.toString("utf8")));
 * @param modulePath Path of the VS Code module to load.
 */
export const forkModule = (modulePath: string, args: string[], options: cp.ForkOptions, dataDir?: string): cp.ChildProcess => {
	let proc: cp.ChildProcess;
	const forkOptions: cp.ForkOptions = {
		stdio: [null, null, null, "ipc"],
	};
	if (options.env) {
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
		proc = cp.spawn(process.execPath, forkArgs, forkOptions);
	} else {
		proc = cp.spawn(process.execPath, ["--require", "ts-node/register", "--require", "tsconfig-paths/register", process.argv[1], ...forkArgs], forkOptions);
	}

	return proc;
};
