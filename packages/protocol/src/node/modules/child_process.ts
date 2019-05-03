import * as cp from "child_process";
import { ServerProxy } from "../../common/proxy";
import { withEnv } from "../../common/util";
import { WritableProxy, ReadableProxy } from "./stream";

// tslint:disable completed-docs

export type ForkProvider = (modulePath: string, args?: string[], options?: cp.ForkOptions) => cp.ChildProcess;

export class ChildProcessProxy extends ServerProxy<cp.ChildProcess> {
	public constructor(instance: cp.ChildProcess) {
		super({
			bindEvents: ["close", "disconnect", "error", "exit", "message"],
			doneEvents: ["close"],
			instance,
		});
	}

	public async kill(signal?: string): Promise<void> {
		this.instance.kill(signal);
	}

	public async disconnect(): Promise<void> {
		this.instance.disconnect();
	}

	public async ref(): Promise<void> {
		this.instance.ref();
	}

	public async unref(): Promise<void> {
		this.instance.unref();
	}

	// tslint:disable-next-line no-any
	public async send(message: any): Promise<void> {
		return new Promise((resolve, reject): void => {
			this.instance.send(message, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	public async getPid(): Promise<number> {
		return this.instance.pid;
	}

	public async dispose(): Promise<void> {
		this.instance.kill();
		setTimeout(() => this.instance.kill("SIGKILL"), 5000); // Double tap.
		await super.dispose();
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
		return this.returnProxies(cp.exec(command, options && withEnv(options), callback));
	}

	public async fork(modulePath: string, args?: string[], options?: cp.ForkOptions): Promise<ChildProcessProxies> {
		return this.returnProxies((this.forkProvider || cp.fork)(modulePath, args, withEnv(options)));
	}

	public async spawn(command: string, args?: string[], options?: cp.SpawnOptions): Promise<ChildProcessProxies> {
		return this.returnProxies(cp.spawn(command, args, withEnv(options)));
	}

	private returnProxies(process: cp.ChildProcess): ChildProcessProxies {
		return {
			childProcess: new ChildProcessProxy(process),
			stdin: process.stdin && new WritableProxy(process.stdin),
			// Child processes streams appear to immediately flow so we need to bind
			// to the data event right away.
			stdout: process.stdout && new ReadableProxy(process.stdout, ["data"]),
			stderr: process.stderr && new ReadableProxy(process.stderr, ["data"]),
		};
	}
}
