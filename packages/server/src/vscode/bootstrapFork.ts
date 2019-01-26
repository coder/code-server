import * as cp from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as path from "path";

export const requireModule = (modulePath: string): void => {
	process.env.AMD_ENTRYPOINT = modulePath;

	// Always do this so we can see console.logs.
	// process.env.VSCODE_ALLOW_IO = "true";

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
export const forkModule = (modulePath: string, env?: NodeJS.ProcessEnv): cp.ChildProcess => {
	let proc: cp.ChildProcess | undefined;

	const args = ["--bootstrap-fork", modulePath];
	if (env) {
		args.push("--env", JSON.stringify(env));
	}
	const options: cp.SpawnOptions = {
		stdio: [null, null, null, "pipe"],
	};
	if (process.env.CLI === "true") {
		proc = cp.spawn(process.execPath, args, options);
	} else {
		proc = cp.spawn(process.execArgv[0], ["-r", "tsconfig-paths/register", process.argv[1], ...args], options);
	}

	return proc;
};
