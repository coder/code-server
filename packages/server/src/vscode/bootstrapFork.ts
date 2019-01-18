import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";

declare var __non_webpack_require__: typeof require;

export const requireModule = (modulePath: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;
	process.env.VSCODE_ALLOW_IO = "true";
	const content = fs.readFileSync(path.join(process.env.BUILD_DIR as string || path.join(__dirname, "../.."), "./build/bootstrap-fork.js"));
	eval(content.toString());
};

/**
 * Uses the internal bootstrap-fork.js to load a module
 * @example
 * const cp = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain");
 * cp.stdout.on("data", (data) => console.log(data.toString("utf8")));
 * cp.stderr.on("data", (data) => console.log(data.toString("utf8")));
 * @param modulePath
 */
export const forkModule = (modulePath: string): cp.ChildProcess => {
	const args = ["--bootstrap-fork", modulePath];
	if (process.env.CLI === "true") {
		return cp.spawn(process.execPath, args);
	} else {
		return cp.spawn("npm", ["start", "--scripts-prepend-node-path", "--", ...args]);
	}
};
