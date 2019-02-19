import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import * as vm from "vm";
import { isCli } from "../constants";

export const requireModule = (modulePath: string, builtInExtensionsDir: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;
	const xml = require("xhr2");
	// tslint:disable-next-line no-any this makes installing extensions work.
	(global as any).XMLHttpRequest = xml.XMLHttpRequest;

	const mod = require("module") as typeof import("module");
	/**
	 * Used for loading extensions. Using __non_webpack_require__ didn't work
	 * as it was not resolving to the FS.
	 */
	(global as any).nativeNodeRequire = (id: string): any => {// tslint:disable-line no-any
		const customMod = new mod.Module(id);
		customMod.filename = id;
		// tslint:disable-next-line no-any
		customMod.paths = (mod as any)._nodeModulePaths(path.dirname(id));

		if (id.startsWith(builtInExtensionsDir)) {
			customMod.loaded = true;
			const req = vm.runInThisContext(mod.wrap(fs.readFileSync(id + ".js").toString()), {
				displayErrors: true,
				filename: id + ".js",
			});
			req(customMod.exports, customMod.require.bind(customMod), customMod, __filename, path.dirname(id));

			return customMod.exports;
		}

		return customMod.require(id);
	};

	let content: Buffer | undefined;
	const readFile = (name: string): Buffer => {
		return fs.readFileSync(path.join(process.env.BUILD_DIR as string || path.join(__dirname, "../.."), "./build", name));
	};
	if (isCli) {
		content = zlib.gunzipSync(readFile("bootstrap-fork.js.gz"));
	} else {
		content = readFile("../resources/bootstrap-fork.js");
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
export const forkModule = (modulePath: string, args: string[], options: cp.ForkOptions): cp.ChildProcess => {
	let proc: cp.ChildProcess;
	const forkArgs = ["--bootstrap-fork", modulePath];
	if (args) {
		forkArgs.push("--args", JSON.stringify(args));
	}
	if (options.env) {
		// This prevents vscode from trying to load original-fs from electron.
		delete options.env.ELECTRON_RUN_AS_NODE;
		forkArgs.push("--env", JSON.stringify(options.env));
	}
	const forkOptions: cp.ForkOptions = {
		stdio: [null, null, null, "ipc"],
	};
	if (isCli) {
		proc = cp.execFile(process.execPath, forkArgs, forkOptions);
	} else {
		proc = cp.spawn(process.execPath, ["--require", "ts-node/register", "--require", "tsconfig-paths/register", process.argv[1], ...forkArgs], forkOptions);
	}

	return proc;
};
