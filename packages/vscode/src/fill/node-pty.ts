import { client } from "@coder/ide/src/fill/client";
import { EventEmitter } from "events";
import * as nodePty from "node-pty";
import { ActiveEval } from "@coder/protocol";

// Use this to prevent Webpack from hijacking require.
declare var __non_webpack_require__: typeof require;

/**
 * Implementation of nodePty for the browser.
 */
class Pty implements nodePty.IPty {
	private readonly emitter = new EventEmitter();
	private readonly ae: ActiveEval;
	private _pid = -1;
	private _process = "";

	public constructor(file: string, args: string[] | string, options: nodePty.IPtyForkOptions) {
		this.ae = client.run((ae, file, args, options) => {
			const nodePty = __non_webpack_require__("node-pty") as typeof import("node-pty");
			const { preserveEnv } = __non_webpack_require__("@coder/ide/src/fill/evaluation") as typeof import("@coder/ide/src/fill/evaluation");

			preserveEnv(options);

			const ptyProc = nodePty.spawn(file, args, options);

			let process = ptyProc.process;
			ae.emit("process", process);
			ae.emit("pid", ptyProc.pid);

			const timer = setInterval(() => {
				if (ptyProc.process !== process) {
					process = ptyProc.process;
					ae.emit("process", process);
				}
			}, 200);

			ptyProc.on("exit", (code, signal) => {
				clearTimeout(timer);
				ae.emit("exit", code, signal);
			});

			ptyProc.on("data", (data) => ae.emit("data", data));

			ae.on("resize", (cols: number, rows: number) => ptyProc.resize(cols, rows));
			ae.on("write", (data: string) => ptyProc.write(data));
			ae.on("kill", (signal: string) => ptyProc.kill(signal));

			return {
				onDidDispose: (cb): void => ptyProc.on("exit", cb),
				dispose: (): void => {
					ptyProc.kill();
					setTimeout(() => ptyProc.kill("SIGKILL"), 5000); // Double tap.
				},
			};
		}, file, Array.isArray(args) ? args : [args], {
			...options,
			tty: {
				columns: options.cols || 100,
				rows: options.rows || 100,
			},
		}, file, args, options);

		this.ae.on("pid", (pid) => this._pid = pid);
		this.ae.on("process", (process) => this._process = process);

		this.ae.on("exit", (code, signal) => this.emitter.emit("exit", code, signal));
		this.ae.on("data", (data) => this.emitter.emit("data", data));
	}

	public get pid(): number {
		return this._pid;
	}

	public get process(): string {
		return this._process;
	}

	// tslint:disable-next-line no-any
	public on(event: string, listener: (...args: any[]) => void): void {
		this.emitter.on(event, listener);
	}

	public resize(columns: number, rows: number): void {
		this.ae.emit("resize", columns, rows);
	}

	public write(data: string): void {
		this.ae.emit("write", data);
	}

	public kill(signal?: string): void {
		this.ae.emit("kill", signal);
	}
}

const ptyType: typeof nodePty = {
	spawn: (file: string, args: string[] | string, options: nodePty.IPtyForkOptions): nodePty.IPty => {
		return new Pty(file, args, options);
	},
};

module.exports = ptyType;
