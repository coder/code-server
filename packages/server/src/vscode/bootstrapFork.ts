import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import * as vm from "vm";

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
	(global as any).nativeNodeRequire = (id: string) => {
		const customMod = new mod.Module(id);
		customMod.filename = id;
		customMod.paths = (<any>mod)._nodeModulePaths(path.dirname(id));

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
	if (process.env.CLI) {
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
export const forkModule = (modulePath: string, env?: NodeJS.ProcessEnv): cp.ChildProcess => {
	let proc: cp.ChildProcess | undefined;

	const args = ["--bootstrap-fork", modulePath];
	if (env) {
		args.push("--env", JSON.stringify(env));
	}
	const options: cp.SpawnOptions = {
		stdio: [null, null, null, "ipc"],
	};
	if (process.env.CLI === "true") {
		proc = cp.execFile(process.execPath, args, options);
	} else {
		proc = cp.spawn(process.execPath, ["--require", "ts-node/register", "--require", "tsconfig-paths/register", process.argv[1], ...args], options);
	}

	return proc;
};
