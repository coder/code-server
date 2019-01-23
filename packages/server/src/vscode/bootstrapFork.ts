import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import { logger, field } from "@coder/logger/src";

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
 * const cp = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain", true);
 * cp.stdout.on("data", (data) => console.log(data.toString("utf8")));
 * cp.stderr.on("data", (data) => console.log(data.toString("utf8")));
 * @param modulePath Path of the VS Code module to load.
 * @param stdio Whether to use stdio (spawn) or send/onMessage (fork).
 */
export const forkModule = (modulePath: string, stdio?: boolean): cp.ChildProcess => {
	const basename = modulePath.split("/").pop()!;
	let i = 0;
	for (; i < basename.length; i++) {
		const character = basename.charAt(i);
		if (character === character.toUpperCase()) {
			break;
		}
	}
	const childLogger = logger.named(basename.substring(0, i));
	childLogger.debug("Forking...", field("module", modulePath));

	let proc: cp.ChildProcess | undefined;

	const args = ["--bootstrap-fork", modulePath];
	if (process.env.CLI === "true") {
		proc = stdio ? cp.spawn(process.execPath, args) : cp.fork(process.execPath, args);
	} else if (stdio) {
		proc = cp.spawn("npm", ["start", "--scripts-prepend-node-path", "--", ...args]);
	} else {
		// TODO: need to fork somehow so we get send/onMessage.
		proc = cp.spawn("npm", ["start", "--scripts-prepend-node-path", "--", ...args]);
	}

	proc.stdout.on("data", (message) => {
		childLogger.debug("stdout", field("message", message.toString().trim()));
	});

	proc.stderr.on("data", (message) => {
		childLogger.debug("stderr", field("message", message.toString().trim()));
	});

	proc.stdin.on("data", (message) => {
		childLogger.debug("stdin", field("message", message.toString().trim()));
	});

	proc.on("message", (message) => {
		childLogger.debug("message", field("message", message.toString().trim()));
	});

	proc.on("exit", (exitCode) => {
		childLogger.debug(`Exited with ${exitCode}`);
	});

	return proc;
};
