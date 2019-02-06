import { client } from "@coder/ide/src/fill/client";
import { EventEmitter } from "events";
import * as nodePty from "node-pty";
import { ChildProcess } from "@coder/protocol/src/browser/command";

type nodePtyType = typeof nodePty;

/**
 * Implementation of nodePty for the browser.
 */
class Pty implements nodePty.IPty {
	private readonly emitter = new EventEmitter();
	private readonly cp: ChildProcess;

	public constructor(file: string, args: string[] | string, options: nodePty.IPtyForkOptions) {
		this.cp = client.spawn(file, Array.isArray(args) ? args : [args], {
			...options,
			tty: {
				columns: options.cols || 100,
				rows: options.rows || 100,
			},
		});
		this.on("write", (d) => this.cp.send(d));
		this.on("kill", (exitCode) => this.cp.kill(exitCode));
		this.on("resize", (cols, rows) => this.cp.resize!({ columns: cols, rows }));

		this.cp.stdout.on("data", (data) => this.emitter.emit("data", data));
		this.cp.stderr.on("data", (data) => this.emitter.emit("data", data));
		this.cp.on("exit", (code) => this.emitter.emit("exit", code));
	}

	public get pid(): number {
		return this.cp.pid!;
	}

	public get process(): string {
		return this.cp.title!;
	}

	// tslint:disable-next-line no-any
	public on(event: string, listener: (...args: any[]) => void): void {
		this.emitter.on(event, listener);
	}

	public resize(columns: number, rows: number): void {
		this.emitter.emit("resize", columns, rows);
	}

	public write(data: string): void {
		this.emitter.emit("write", data);
	}

	public kill(signal?: string): void {
		this.emitter.emit("kill", signal);
	}
}

const ptyType: nodePtyType = {
	spawn: (file: string, args: string[] | string, options: nodePty.IPtyForkOptions): nodePty.IPty => {
		return new Pty(file, args, options);
	},
};

module.exports = ptyType;
