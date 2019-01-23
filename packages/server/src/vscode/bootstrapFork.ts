import * as cp from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as path from "path";
import { Logger, logger, field } from "@coder/logger/src";

const getChildLogger = (modulePath: string): Logger => {
	const basename = modulePath.split("/").pop()!;
	let i = 0;
	for (; i < basename.length; i++) {
		const character = basename.charAt(i);
		if (character === character.toUpperCase()) {
			break;
		}
	}

	return  logger.named(basename.substring(0, i));
};

export const requireModule = (modulePath: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;
	process.env.VSCODE_ALLOW_IO = "true";

	if (!process.send) {
		const socket = new net.Socket({ fd: 3 });
		socket.on("data", (data) => {
			process.emit("message", JSON.parse(data.toString()), undefined);
		});

		// tslint:disable-next-line no-any
		process.send = (message: any): void => {
			socket.write(JSON.stringify(message));
		};
	}

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
export const forkModule = (modulePath: string): cp.ChildProcess => {
	const childLogger = getChildLogger(modulePath);
	childLogger.debug("Forking...", field("module", modulePath));

	let proc: cp.ChildProcess | undefined;

	const args = ["--bootstrap-fork", modulePath];
	const options: cp.SpawnOptions = {
		stdio: [null, null, null, "pipe"],
	};
	if (process.env.CLI === "true") {
		proc = cp.spawn(process.execPath, args, options);
	} else {
		proc = cp.spawn(process.execArgv[0], ["-r", "tsconfig-paths/register", process.argv[1], ...args], options);
	}

	proc.on("exit", (exitCode) => {
		childLogger.debug(`Exited with ${exitCode}`);
	});

	return proc;
};
