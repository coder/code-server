/// <reference path="../../../../../lib/vscode/src/typings/node-pty.d.ts" />
import { EventEmitter } from "events";
import * as pty from "node-pty";
import { ServerProxy } from "../../common/proxy";
import { withEnv } from "../../common/util";

// tslint:disable completed-docs

/**
 * Server-side IPty proxy.
 */
export class NodePtyProcessProxy extends ServerProxy {
	public constructor(private readonly process: pty.IPty) {
		super({
			bindEvents: ["process", "data", "exit"],
			doneEvents: ["exit"],
			instance: new EventEmitter(),
		});

		this.process.on("data", (data) => this.instance.emit("data", data));
		this.process.on("exit", (exitCode, signal) => this.instance.emit("exit", exitCode, signal));

		let name = process.process;
		setTimeout(() => { // Need to wait for the caller to listen to the event.
			this.instance.emit("process", name);
		}, 1);
		const timer = setInterval(() => {
			if (process.process !== name) {
				name = process.process;
				this.instance.emit("process", name);
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

	public async dispose(): Promise<void> {
		this.process.kill();
		setTimeout(() => this.process.kill("SIGKILL"), 5000); // Double tap.
		await super.dispose();
	}
}

/**
 * Server-side node-pty proxy.
 */
export class NodePtyModuleProxy {
	public async spawn(file: string, args: string[] | string, options: pty.IPtyForkOptions): Promise<NodePtyProcessProxy> {
		return new NodePtyProcessProxy(require("node-pty").spawn(file, args, withEnv(options)));
	}
}
