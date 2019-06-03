import { logger } from "@coder/logger";
import * as cp from "child_process";
import * as os from "os";
import * as path from "path";

/**
 * Fork a process that runs a module through VS Code's loader.
 *
 * @example
 * const cp = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain");
 * cp.stdout.on("data", (data) => console.log(data.toString("utf8")));
 * cp.stderr.on("data", (data) => console.log(data.toString("utf8")));
 *
 * @param modulePath Path of the VS Code module to load.
 */
export const forkModule = (modulePath: string, args?: string[], options?: cp.ForkOptions, dataDir?: string): cp.ChildProcess => {
	const forkArgs = [];
	if (args) {
		forkArgs.push(...args);
	}
	if (dataDir) {
		forkArgs.push("--user-data-dir", dataDir);
	}

	const forkOptions = {
		...options,
		env: {
			...process.env, ...(options && options.env || {}),
			AMD_ENTRYPOINT: modulePath,
		},
	};

	const proc = cp.fork(
		path.join(__dirname, "bootstrap-fork"),
		forkArgs,
		forkOptions,
	);

	if (os.platform() === "linux" && forkArgs.includes("--type=watcherService")) {
		cp.exec(`renice -n 19 -p ${proc.pid}`, (error) => {
			if (error) {
				logger.warn(error.message);
			}
		});
	}

	return proc;
};
