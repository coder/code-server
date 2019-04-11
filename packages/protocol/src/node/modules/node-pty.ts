/// <reference path="../../../../../lib/vscode/src/typings/node-pty.d.ts" />
import { EventEmitter } from "events";
import * as pty from "node-pty";
import { ServerProxy } from "../../common/proxy";
import { preserveEnv } from "../../common/util";

// tslint:disable completed-docs

/**
 * Server-side IPty proxy.
 */
export class NodePtyProcessProxy implements ServerProxy {
	private readonly emitter = new EventEmitter();

	public constructor(private readonly process: pty.IPty) {
		let name = process.process;
		setTimeout(() => { // Need to wait for the caller to listen to the event.
			this.emitter.emit("process", name);
		}, 1);
		const timer = setInterval(() => {
			if (process.process !== name) {
				name = process.process;
				this.emitter.emit("process", name);
			}
		}, 200);

		this.process.on("exit", () => clearInterval(timer));
	}

	public async getPid(): Promise<number> {
		return this.process.pid;
	}

	public async getProcess(): Promise<string> {
		return this.process.process;
	}

	public async kill(signal?: string): Promise<void> {
		this.process.kill(signal);
	}

	public async resize(columns: number, rows: number): Promise<void> {
		this.process.resize(columns, rows);
	}

	public async write(data: string): Promise<void> {
		this.process.write(data);
	}

	public async onDone(cb: () => void): Promise<void> {
		this.process.on("exit", cb);
	}

	public async dispose(): Promise<void> {
		this.process.kill();
		setTimeout(() => this.process.kill("SIGKILL"), 5000); // Double tap.
		this.emitter.removeAllListeners();
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		this.emitter.on("process", (process) => cb("process", process));
		this.process.on("data", (data) => cb("data", data));
		this.process.on("exit", (exitCode, signal) => cb("exit", exitCode, signal));
	}
}

/**
 * Server-side node-pty proxy.
 */
export class NodePtyModuleProxy {
	public async spawn(file: string, args: string[] | string, options: pty.IPtyForkOptions): Promise<NodePtyProcessProxy> {
		preserveEnv(options);

		return new NodePtyProcessProxy(require("node-pty").spawn(file, args, options));
	}
}
