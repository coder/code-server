import * as cp from "child_process";
import * as stream from "stream";
import * as events from "events";
import * as net from "net";
import { useBuffer, throwUnimplementedError, throwSyncError } from "./util";

/**
 * Readable stream.
 */
class Readable extends stream.Readable {

	/**
	 * Read a chunk.
	 */
	public _read(_size: number): void {
		// There is nothing to actually read.
	}

}

/**
 * Implementation of ChildProcess for the browser.
 */
class ChildProcess extends events.EventEmitter implements cp.ChildProcess {

	public connected: boolean = true;
	public killed: boolean = false;
	public pid = 0;
	public stdin: stream.Writable;
	public stdout: Readable;
	public stderr: Readable;
	public stdio: [stream.Writable, stream.Readable, stream.Readable];

	private emitter = new events.EventEmitter();

	public constructor(private session) {
		super();

		this.emitter = new events.EventEmitter();
		this.stdin = new stream.Writable();
		this.stdin._write = (
			chunk: any, // tslint:disable-line no-any so we can match the Node API.
			_encoding: string,
			callback: (error?: Error) => void,
		): void => {
			session.sendStdin(chunk.toString());
			callback();
		};
		this.stdout = new Readable();
		this.stderr = new Readable();
		this.stdio = [this.stdin, this.stdout, this.stderr];

		session.onDone((exitCode) => {
			this.emitter.emit("exit", exitCode);
		});

		session.onDisconnect(() => {
			this.emitter.emit("exit", -1);
		});

		session.onStdout((data) => {
			this.stdout.emit("data", data);
		});

		session.onStderr((data) => {
			this.stderr.emit("data", data);
		});
	}

	/**
	 * Kill the session.
	 */
	public kill(): void {
		this.session.close();
	}

	/**
	 * Not implemented.
	 */
	public disconnect(): void {
		throwUnimplementedError();
	}

	/**
	 * Not implemented.
	 */
	public ref(): void {
		throwUnimplementedError();
	}

	/**
	 * Not implemented.
	 */
	public unref(): void {
		throwUnimplementedError();
	}

	/**
	 * Not implemented.
	 */
	public send(
		_message: any, // tslint:disable-line no-any so we can match the Node API.
		_sendHandle?: net.Socket | net.Server | ((error: Error) => void),
		_options?: cp.MessageOptions | ((error: Error) => void),
		_callback?: (error: Error) => void,
	): boolean {
		throw throwUnimplementedError();
	}

	/**
	 * Add event listener.
	 */
	public on(
		eventName: string,
		callback: (...args: any[]) => void, // tslint:disable-line no-any so we can match the Node API.
	): this {
		this.emitter.on(eventName, callback);

		return this;
	}

}

// tslint:disable only-arrow-functions
function exec(
	command: string,
	options?: { encoding?: BufferEncoding | string | "buffer" | null } & cp.ExecOptions | null | ((error: Error | null, stdout: string, stderr: string) => void) | ((error: Error | null, stdout: Buffer, stderr: Buffer) => void),
	callback?: ((error: Error | null, stdout: string, stderr: string) => void) | ((error: Error | null, stdout: Buffer, stderr: Buffer) => void),
): cp.ChildProcess {
	const process = new ChildProcess(wush.execute({ command }));

	let stdout = "";
	process.stdout.on("data", (data) => {
		stdout += data.toString();
	});

	let stderr = "";
	process.stderr.on("data", (data) => {
		stderr += data.toString();
	});

	process.on("exit", (exitCode) => {
		const error = exitCode !== 0 ? new Error(stderr) : null;
		if (typeof options === "function") {
			callback = options;
		}
		// @ts-ignore not sure how to make this work.
		callback(
			error,
			useBuffer(options) ? Buffer.from(stdout) : stdout,
			useBuffer(options) ? Buffer.from(stderr) : stderr,
		);
	});

	return process;
}

function fork(modulePath: string): cp.ChildProcess {
	return new ChildProcess(wush.execute({
		command: `node ${modulePath}`,
	}));
}

function spawn(_command: string, _args?: ReadonlyArray<string>, _options?: cp.SpawnOptions): cp.ChildProcess {
	throw new Error("not implemented");
}
// tslint:enable only-arrow-functions

// To satisfy the types.
// tslint:disable no-any
exec.__promisify__ = undefined as any;
// tslint:enable no-any

const exp: typeof cp = {
	exec,
	execFile: throwUnimplementedError,
	execFileSync: throwSyncError,
	execSync: throwSyncError,
	fork,
	spawn,
	spawnSync: throwSyncError,
};

export = exp;
