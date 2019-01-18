import * as cp from "child_process";
import { EventEmitter } from "events";
import * as nodePty from "node-pty";

type nodePtyType = typeof nodePty;

/**
 * Implementation of nodePty for the browser.
 */
class Pty implements nodePty.IPty {

	private readonly emitter: EventEmitter;

	public constructor(file: string, args: string[] | string, options: nodePty.IPtyForkOptions) {
		this.emitter = new EventEmitter();
		const session = wush.execute({
			command: `${file} ${Array.isArray(args) ? args.join(" ") : args}`,
			directory: options.cwd,
			environment: {
				...(options.env || {}),
				TERM: "xterm-color",
			},
			size: options && options.cols && options.rows ? {
				columns: options.cols,
				rows: options.rows,
			} : {
					columns: 100,
					rows: 100,
				},
		});
		this.on("write", (data) => session.sendStdin(data));
		this.on("kill", (exitCode) => session.close());
		this.on("resize", (columns, rows) => session.setSize({ columns, rows }));
		session.onStdout((data) => this.emitter.emit("data", data));
		session.onStderr((data) => this.emitter.emit("data", data));
		session.onDone((exitCode) => this.emitter.emit("exit", exitCode));
	}

	public get pid(): number {
		return 1;
	}

	public get process(): string {
		return "unknown";
	}

	public on(event: string, listener: (...args) => void): void {
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

exports = ptyType;
