import * as cp from "child_process";
import { ServerProxy } from "../../common/proxy";
import { preserveEnv } from "../../common/util";
import { WritableProxy, ReadableProxy } from "./stream";

// tslint:disable completed-docs

export type ForkProvider = (modulePath: string, args?: string[], options?: cp.ForkOptions) => cp.ChildProcess;

export class ChildProcessProxy implements ServerProxy {
	public constructor(private readonly process: cp.ChildProcess) {}

	public async kill(signal?: string): Promise<void> {
		this.process.kill(signal);
	}

	public async disconnect(): Promise<void> {
		this.process.disconnect();
	}

	public async ref(): Promise<void> {
		this.process.ref();
	}

	public async unref(): Promise<void> {
		this.process.unref();
	}

	// tslint:disable-next-line no-any
	public async send(message: any): Promise<void> {
		return new Promise((resolve, reject): void => {
			this.process.send(message, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	public async getPid(): Promise<number> {
		return this.process.pid;
	}

	public async onDone(cb: () => void): Promise<void> {
		this.process.on("close", cb);
	}

	public async dispose(): Promise<void> {
		this.process.kill();
		setTimeout(() => this.process.kill("SIGKILL"), 5000); // Double tap.
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		this.process.on("close", (code, signal) => cb("close", code, signal));
		this.process.on("disconnect", () => cb("disconnect"));
		this.process.on("error", (error) => cb("error", error));
		this.process.on("exit", (exitCode, signal) => cb("exit", exitCode, signal));
		this.process.on("message", (message) => cb("message", message));
	}
}

export interface ChildProcessProxies {
	childProcess: ChildProcessProxy;
	stdin?: WritableProxy | null;
	stdout?: ReadableProxy | null;
	stderr?: ReadableProxy | null;
}

export class ChildProcessModuleProxy {
	public constructor(private readonly forkProvider?: ForkProvider) {}

	public async exec(
		command: string,
		options?: { encoding?: string | null } & cp.ExecOptions | null,
		callback?: ((error: cp.ExecException | null, stdin: string | Buffer, stdout: string | Buffer) => void),
	): Promise<ChildProcessProxies> {
		preserveEnv(options);

		return this.returnProxies(cp.exec(command, options, callback));
	}

	public async fork(modulePath: string, args?: string[], options?: cp.ForkOptions): Promise<ChildProcessProxies> {
		preserveEnv(options);

		return this.returnProxies((this.forkProvider || cp.fork)(modulePath, args, options));
	}

	public async spawn(command: string, args?: string[], options?: cp.SpawnOptions): Promise<ChildProcessProxies> {
		preserveEnv(options);

		return this.returnProxies(cp.spawn(command, args, options));
	}

	private returnProxies(process: cp.ChildProcess): ChildProcessProxies {
		return {
			childProcess: new ChildProcessProxy(process),
			stdin: process.stdin && new WritableProxy(process.stdin),
			stdout: process.stdout && new ReadableProxy(process.stdout),
			stderr: process.stderr && new ReadableProxy(process.stderr),
		};
	}
}
