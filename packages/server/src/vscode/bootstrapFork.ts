import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";

export const requireModule = (modulePath: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;

	const xml = require("xhr2");

	// tslint:disable-next-line no-any this makes installing extensions work.
	(global as any).XMLHttpRequest = xml.XMLHttpRequest;

	// Always do this so we can see console.logs.
	// process.env.VSCODE_ALLOW_IO = "true";

	const content = fs.readFileSync(path.join(process.env.BUILD_DIR as string || path.join(__dirname, "../.."), "./build/bootstrap-fork.js"));
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
		proc = cp.spawn(process.execPath, args, options);
	} else {
		proc = cp.spawn(process.execArgv[0], ["-r", "tsconfig-paths/register", process.argv[1], ...args], options);
	}

	return proc;
};
