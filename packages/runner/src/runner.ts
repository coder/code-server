import * as cp from "child_process";
import {field, Logger, logger, time} from "@coder/logger";

export interface CommandResult {
	readonly exitCode: number;
	readonly stdout: string;
	readonly stderr: string;
}

const execute = (command: string, args: string[] = [], options: cp.SpawnOptions, logger: Logger): Promise<CommandResult> => {
	let resolve: (result: CommandResult) => void;
	const prom = new Promise<CommandResult>((res): void => {
		resolve = res;
	});

	const stdout: string[] = [];
	const stderr: string[] = [];
	const complete = (exitCode: number): void => {
		resolve({
			stderr: stderr.join(""),
			stdout: stdout.join(""),
			exitCode,
		});
	};
	logger.info(`Executing '${command} ${JSON.stringify(args)}'`, field("options", options));
	const proc = cp.spawn(command, args.length > 0 ? args : [], options);
	proc.on("close", (code) => {
		complete(code);
	});
	proc.on("exit", (code) => {
		complete(code!);
	});
	proc.stdout.on("data", (d) => {
		stdout.push(d.toString());
		logger.debug("stdio", field("stdout", d.toString()));
	});
	proc.stderr.on("data", (d) => {
		stderr.push(d.toString());
		logger.debug("stdio", field("stderr", d.toString()));
	});

	return prom;
};

// tslint:disable-next-line no-any
export type TaskFunction = (runner: Runner, ...args: any[]) => void | Promise<void>;

export interface Runner {
	cwd: string;

	execute(command: string, args?: string[], env?: object): Promise<CommandResult>;
}

export interface Task {
	readonly name: string;
	readonly func: TaskFunction;
}

const tasks = new Map<string, Task>();
const activated = new Map<string, Promise<void>>();

export const register = (name: string, func: TaskFunction): () => void | Promise<void> => {
	if (tasks.has(name)) {
		throw new Error(`Task "${name}" already registered`);
	}

	tasks.set(name, {
		name,
		func,
	});

	return (): void | Promise<void> => {
		return run(name);
	};
};

export const run = (name: string = process.argv[2]): void | Promise<void> => {
	const task = tasks.get(name);
	if (!task) {
		logger.error("Task not found.", field("name", name), field("available", Array.from(tasks.keys())));

		return process.exit(1);
	}
	if (activated.has(name)) {
		return activated.get(name);
	}
	let cwd: string = process.cwd();
	const log = logger.named(name);
	const timer = time(Number.MAX_SAFE_INTEGER);
	let outputTimer: NodeJS.Timer | undefined;
	log.info("Starting...");
	const prom = task.func({
		set cwd(path: string) {
			cwd = path;
		},
		execute(command: string, args: string[] = [], env?: object): Promise<CommandResult> {
			const prom = execute(command, args, {
				cwd,
				env: env as NodeJS.ProcessEnv,
			}, log);

			return prom.then((result: CommandResult) => {
				if (result.exitCode != 0) {
					log.error("failed",
						field("exitCode", result.exitCode),
						field("stdout", result.stdout),
						field("stderr", result.stderr)
					);
				}

				return result;
			});
		},
	}, ...process.argv.slice(3));

	if (prom) {
		activated.set(name, prom);

		const doOutput = (): void => {
			outputTimer = setTimeout(() => {
				log.info("Still running...");
				doOutput();
			}, 60 * 1000 * 5);
		};
		doOutput();

		prom.then(() => {
			if (outputTimer) {
				clearTimeout(outputTimer);
			}
			log.info("Completed!", field("time", timer));
		}).catch((ex) => {
			activated.delete(name);
			log.error(`Failed: ${ex.message}`);
			log.error(`Stack: ${ex.stack}`);

			return process.exit(1);
		});
	}

	return prom;
};
