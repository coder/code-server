import * as cp from "child_process";
import * as net from "net";
import * as stream from "stream";
import { callbackify } from "util";
import { ClientProxy } from "../../common/proxy";
import { ChildProcessModuleProxy, ChildProcessProxy, ChildProcessProxies } from "../../node/modules/child_process";
import { Readable, Writable } from "./stream";

// tslint:disable completed-docs

export class ChildProcess extends ClientProxy<ChildProcessProxy> implements cp.ChildProcess {
	public readonly stdin: stream.Writable;
	public readonly stdout: stream.Readable;
	public readonly stderr: stream.Readable;
	public readonly stdio: [stream.Writable, stream.Readable, stream.Readable];

	private _connected: boolean = false;
	private _killed: boolean = false;
	private _pid = -1;

	public constructor(proxyPromises: Promise<ChildProcessProxies>) {
		super(proxyPromises.then((p) => p.childProcess));
		this.stdin = new Writable(proxyPromises.then((p) => p.stdin!));
		this.stdout = new Readable(proxyPromises.then((p) => p.stdout!));
		this.stderr = new Readable(proxyPromises.then((p) => p.stderr!));
		this.stdio = [this.stdin, this.stdout, this.stderr];

		this.catch(this.proxy.getPid().then((pid) => {
			this._pid = pid;
			this._connected = true;
		}));
		this.on("disconnect", () => this._connected = false);
		this.on("exit", () => {
			this._connected = false;
			this._killed = true;
		});
	}

	public get pid(): number {
		return this._pid;
	}

	public get connected(): boolean {
		return this._connected;
	}

	public get killed(): boolean {
		return this._killed;
	}

	public kill(): void {
		this._killed = true;
		this.catch(this.proxy.kill());
	}

	public disconnect(): void {
		this.catch(this.proxy.disconnect());
	}

	public ref(): void {
		this.catch(this.proxy.ref());
	}

	public unref(): void {
		this.catch(this.proxy.unref());
	}

	public send(
		message: any, // tslint:disable-line no-any
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

		callbackify(this.proxy.send)(message, (error) => {
			if (callback) {
				callback(error);
			}
		});

		return true; // Always true since we can't get this synchronously.
	}

	/**
	 * Exit and close the process when disconnected.
	 */
	protected handleDisconnect(): void {
		this.emit("exit", 1);
		this.emit("close");
	}
}

export class ChildProcessModule {
	public constructor(private readonly proxy: ChildProcessModuleProxy) {}

	public exec = (
		command: string,
		options?: { encoding?: string | null } & cp.ExecOptions | null
			| ((error: cp.ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void),
		callback?: ((error: cp.ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void),
	): cp.ChildProcess => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}

		return new ChildProcess(this.proxy.exec(command, options, callback));
	}

	public fork = (modulePath: string, args?: string[] | cp.ForkOptions, options?: cp.ForkOptions): cp.ChildProcess => {
		if (!Array.isArray(args)) {
			options = args;
			args = undefined;
		}

		return new ChildProcess(this.proxy.fork(modulePath, args, options));
	}

	public spawn = (command: string, args?: string[] | cp.SpawnOptions, options?: cp.SpawnOptions): cp.ChildProcess => {
		if (!Array.isArray(args)) {
			options = args;
			args = undefined;
		}

		return new ChildProcess(this.proxy.spawn(command, args, options));
	}
}
