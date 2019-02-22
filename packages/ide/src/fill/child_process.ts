import * as cp from "child_process";
import * as net from "net";
import * as stream from "stream";
import { CallbackEmitter, ActiveEvalReadable, ActiveEvalWritable } from "@coder/protocol";
import { client } from "./client";
import { promisify } from "util";

declare var __non_webpack_require__: typeof require;

class ChildProcess extends CallbackEmitter implements cp.ChildProcess {
	private _connected: boolean = false;
	private _killed: boolean = false;
	private _pid = -1;
	public readonly stdin: stream.Writable;
	public readonly stdout: stream.Readable;
	public readonly stderr: stream.Readable;
	// We need the explicit type otherwise TypeScript thinks it is (Writable | Readable)[].
	public readonly stdio: [stream.Writable, stream.Readable, stream.Readable] = [this.stdin, this.stdout, this.stderr];

	// tslint:disable no-any
	public constructor(method: "exec", command: string, options?: { encoding?: string | null } & cp.ExecOptions | null, callback?: (...args: any[]) => void);
	public constructor(method: "fork", modulePath: string, options?: cp.ForkOptions, args?: string[]);
	public constructor(method: "spawn", command: string, options?: cp.SpawnOptions, args?: string[]);
	public constructor(method: "exec" | "spawn" | "fork", command: string, options: object = {}, callback?: string[] | ((...args: any[]) => void)) {
	// tslint:enable no-any
		super();

		let args: string[] = [];
		if (Array.isArray(callback)) {
			args = callback;
			callback = undefined;
		}

		this.ae = client.run((ae, command, method, args, options, callbackId) => {
			const cp = __non_webpack_require__("child_process") as typeof import("child_process");

			ae.preserveEnv(options);

			let childProcess: cp.ChildProcess;
			switch (method) {
				case "exec":
					childProcess = cp.exec(command, options, ae.maybeCallback(callbackId));
					break;
				case "spawn":
					childProcess = cp.spawn(command, args, options);
					break;
				case "fork":
					childProcess = ae.fork(command, args, options);
					break;
				default:
					throw new Error(`invalid method ${method}`);
			}

			ae.on("disconnect", () => childProcess.disconnect());
			ae.on("kill", (signal: string) => childProcess.kill(signal));
			ae.on("ref", () => childProcess.ref());
			ae.on("send", (message: string, callbackId: number) => childProcess.send(message, ae.maybeCallback(callbackId)));
			ae.on("unref", () => childProcess.unref());

			ae.emit("pid", childProcess.pid);
			childProcess.on("close", (code, signal) => ae.emit("close", code, signal));
			childProcess.on("disconnect", () => ae.emit("disconnect"));
			childProcess.on("error", (error) => ae.emit("error", error));
			childProcess.on("exit", (code, signal) => ae.emit("exit", code, signal));
			childProcess.on("message", (message) => ae.emit("message", message));

			if (childProcess.stdin) {
				const stdinAe = ae.createUnique("stdin");
				stdinAe.bindWritable(childProcess.stdin);
			}
			if (childProcess.stdout) {
				const stdoutAe = ae.createUnique("stdout");
				stdoutAe.bindReadable(childProcess.stdout);
			}
			if (childProcess.stderr) {
				const stderrAe = ae.createUnique("stderr");
				stderrAe.bindReadable(childProcess.stderr);
			}

			return {
				onDidDispose: (cb): cp.ChildProcess => childProcess.on("close", cb),
				dispose: (): void => {
					childProcess.kill();
					setTimeout(() => childProcess.kill("SIGKILL"), 5000); // Double tap.
				},
			};
		}, command, method, args, options, this.storeCallback(callback));

		this.ae.on("pid", (pid) => {
			this._pid = pid;
			this._connected = true;
		});

		this.stdin = new ActiveEvalWritable(this.ae.createUnique("stdin"));
		this.stdout = new ActiveEvalReadable(this.ae.createUnique("stdout"));
		this.stderr = new ActiveEvalReadable(this.ae.createUnique("stderr"));

		this.ae.on("close", (code, signal) => this.emit("close", code, signal));
		this.ae.on("disconnect", () => this.emit("disconnect"));
		this.ae.on("error", (error) => this.emit("error", error));
		this.ae.on("exit", (code, signal) => {
			this._connected = false;
			this._killed = true;
			this.emit("exit", code, signal);
		});
		this.ae.on("message", (message) => this.emit("message", message));
	}

	public get pid(): number { return this._pid; }
	public get connected(): boolean { return this._connected; }
	public get killed(): boolean { return this._killed; }

	public kill(): void { this.ae.emit("kill"); }
	public disconnect(): void { this.ae.emit("disconnect"); }
	public ref(): void { this.ae.emit("ref"); }
	public unref(): void { this.ae.emit("unref"); }

	public send(
		message: any, // tslint:disable-line no-any to match spec
		sendHandle?: net.Socket | net.Server | ((error: Error) => void),
		options?: cp.MessageOptions | ((error: Error) => void),
		callback?: (error: Error) => void): boolean {
		if (typeof sendHandle === "function") {
			callback = sendHandle;
			sendHandle = undefined;
		} else if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		if (sendHandle || options) {
			throw new Error("sendHandle and options are not supported");
		}
		this.ae.emit("send", message, this.storeCallback(callback));

		// Unfortunately this will always have to be true since we can't retrieve
		// the actual response synchronously.
		return true;
	}
}

class CP {
	public readonly ChildProcess = ChildProcess;

	public exec = (
		command: string,
		options?: { encoding?: string | null } & cp.ExecOptions | null | ((error: cp.ExecException | null, stdout: string, stderr: string) => void) | ((error: cp.ExecException | null, stdout: Buffer, stderr: Buffer) => void),
		callback?: ((error: cp.ExecException | null, stdout: string, stderr: string) => void) | ((error: cp.ExecException | null, stdout: Buffer, stderr: Buffer) => void),
	): cp.ChildProcess => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}

		return new ChildProcess("exec", command, options, callback);
	}

	public fork = (modulePath: string, args?: string[] | cp.ForkOptions, options?: cp.ForkOptions): cp.ChildProcess => {
		if (args && !Array.isArray(args)) {
			options = args;
			args = undefined;
		}

		return new ChildProcess("fork", modulePath, options, args);
	}

	public spawn = (command: string, args?: string[] | cp.SpawnOptions, options?: cp.SpawnOptions): cp.ChildProcess => {
		if (args && !Array.isArray(args)) {
			options = args;
			args = undefined;
		}

		return new ChildProcess("spawn", command, options, args);
	}
}

const fillCp = new CP();
// Methods that don't follow the standard callback pattern (an error followed
// by a single result) need to provide a custom promisify function.
Object.defineProperty(fillCp.exec, promisify.custom, {
	value: (
		command: string,
		options?: { encoding?: string | null } & cp.ExecOptions | null,
	): Promise<{ stdout: string | Buffer, stderr: string | Buffer }> => {
		return new Promise((resolve, reject): void => {
			fillCp.exec(command, options, (error: cp.ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => {
				if (error) {
					reject(error);
				} else {
					resolve({ stdout, stderr });
				}
			});
		});
	},
});
export = fillCp;
