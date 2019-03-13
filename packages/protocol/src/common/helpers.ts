/// <reference path="../../../../lib/vscode/src/typings/spdlog.d.ts" />
/// <reference path="../../node_modules/node-pty-prebuilt/typings/node-pty.d.ts" />
import { ChildProcess, SpawnOptions, ForkOptions } from "child_process";
import { EventEmitter } from "events";
import { Socket } from "net";
import { Duplex, Readable, Writable } from "stream";
import { IDisposable } from "@coder/disposable";
import { logger } from "@coder/logger";

// tslint:disable no-any

export type ForkProvider = (modulePath: string, args: string[], options: ForkOptions) => ChildProcess;

export interface Disposer extends IDisposable {
	onDidDispose: (cb: () => void) => void;
}

interface ActiveEvalEmitter {
	removeAllListeners(event?: string): void;
	emit(event: string, ...args: any[]): void;
	on(event: string, cb: (...args: any[]) => void): void;
}

/**
 * For any non-external modules that are not built in, we need to require and
 * access them server-side. A require on the client-side won't work since that
 * code won't exist on the server (and bloat the client with an unused import),
 * and we can't manually import on the server-side and then call
 * `__webpack_require__` on the client-side because Webpack stores modules by
 * their paths which would require us to hard-code the path.
 */
export interface Modules {
	pty: typeof import("node-pty");
	spdlog: typeof import("spdlog");
	trash: typeof import("trash");
}

/**
 * Helper class for server-side evaluations.
 */
export class EvalHelper {
	public constructor(public modules: Modules) {}

	/**
	 * Some spawn code tries to preserve the env (the debug adapter for instance)
	 * but the env is mostly blank (since we're in the browser), so we'll just
	 * always preserve the main process.env here, otherwise it won't have access
	 * to PATH, etc.
	 * TODO: An alternative solution would be to send the env to the browser?
	*/
	public preserveEnv(options: SpawnOptions | ForkOptions): void {
		if (options && options.env) {
			options.env = { ...process.env, ...options.env };
		}
	}
}

/**
 * Helper class for client-side active evaluations.
 */
export class ActiveEvalHelper implements ActiveEvalEmitter {
	public constructor(private readonly emitter: ActiveEvalEmitter) {}

	public removeAllListeners(event?: string): void {
		this.emitter.removeAllListeners(event);
	}

	public emit(event: string, ...args: any[]): void {
		this.emitter.emit(event, ...args);
	}

	public on(event: string, cb: (...args: any[]) => void): void {
		this.emitter.on(event, cb);
	}

	/**
	 * Create a new helper to make unique events for an item.
	 */
	public createUnique(id: number | "stdout" | "stderr" | "stdin"): ActiveEvalHelper {
		return new ActiveEvalHelper(this.createUniqueEmitter(id));
	}

	/**
	 * Wrap the evaluation emitter to make unique events for an item to prevent
	 * conflicts when it shares that emitter with other items.
	 */
	protected createUniqueEmitter(id: number | "stdout" | "stderr" | "stdin"): ActiveEvalEmitter {
		let events = <string[]>[];

		return {
			removeAllListeners: (event?: string): void => {
				if (!event) {
					events.forEach((e) => this.removeAllListeners(e));
					events = [];
				} else {
					const index = events.indexOf(event);
					if (index !== -1) {
						events.splice(index, 1);
						this.removeAllListeners(`${event}:${id}`);
					}
				}
			},
			emit: (event: string, ...args: any[]): void => {
				this.emit(`${event}:${id}`, ...args);
			},
			on: (event: string, cb: (...args: any[]) => void): void => {
				if (!events.includes(event)) {
					events.push(event);
				}
				this.on(`${event}:${id}`, cb);
			},
		};
	}
}

/**
 * Helper class for server-side active evaluations.
 */
export class ServerActiveEvalHelper extends ActiveEvalHelper implements EvalHelper {
	private readonly evalHelper: EvalHelper;

	public constructor(public modules: Modules, emitter: ActiveEvalEmitter, public readonly fork: ForkProvider) {
		super(emitter);
		this.evalHelper = new EvalHelper(modules);
	}

	public preserveEnv(options: SpawnOptions | ForkOptions): void {
		this.evalHelper.preserveEnv(options);
	}

	/**
	 * If there is a callback ID, return a function that emits the callback event
	 * on the active evaluation with that ID and all arguments passed to it.
	 * Otherwise, return undefined.
	 */
	public maybeCallback(callbackId?: number): ((...args: any[])  => void) | undefined {
		return typeof callbackId !== "undefined" ? (...args: any[]): void => {
			this.emit("callback", callbackId, ...args);
		} : undefined;
	}

	/**
	 * Bind a socket to an active evaluation and returns a disposer.
	 */
	public bindSocket(socket: Socket): Disposer {
		socket.on("connect", () => this.emit("connect"));
		socket.on("lookup", (error, address, family, host) => this.emit("lookup", error, address, family, host));
		socket.on("timeout", () => this.emit("timeout"));

		this.on("connect", (options, callbackId) => socket.connect(options, this.maybeCallback(callbackId)));
		this.on("ref", () => socket.ref());
		this.on("setKeepAlive", (enable, initialDelay) => socket.setKeepAlive(enable, initialDelay));
		this.on("setNoDelay", (noDelay) => socket.setNoDelay(noDelay));
		this.on("setTimeout", (timeout, callbackId) => socket.setTimeout(timeout, this.maybeCallback(callbackId)));
		this.on("unref", () => socket.unref());

		this.bindReadable(socket);
		this.bindWritable(socket);

		return {
			onDidDispose: (cb): Socket => socket.on("close", cb),
			dispose: (): void => {
				socket.removeAllListeners();
				socket.end();
				socket.destroy();
				socket.unref();
			},
		};
	}

	/**
	 * Bind a writable stream to the active evaluation.
	 */
	public bindWritable(writable: Writable | Duplex): void {
		if (!((writable as Readable).read)) { // To avoid binding twice.
			writable.on("close", () => this.emit("close"));
			writable.on("error", (error) => this.emit("error", error));

			this.on("destroy", () => writable.destroy());
		}

		writable.on("drain", () => this.emit("drain"));
		writable.on("finish", () => this.emit("finish"));
		writable.on("pipe", () => this.emit("pipe"));
		writable.on("unpipe", () => this.emit("unpipe"));

		this.on("cork", () => writable.cork());
		this.on("end", (chunk, encoding, callbackId) => writable.end(chunk, encoding, this.maybeCallback(callbackId)));
		this.on("setDefaultEncoding", (encoding) => writable.setDefaultEncoding(encoding));
		this.on("uncork", () => writable.uncork());
		// Sockets can pass an fd instead of a callback but streams cannot.
		this.on("write", (chunk, encoding, fd, callbackId) => writable.write(chunk, encoding, this.maybeCallback(callbackId) || fd));
	}

	/**
	 * Bind a readable stream to the active evaluation.
	 */
	public bindReadable(readable: Readable): void {
		// Streams don't have an argument on close but sockets do.
		readable.on("close", (...args: any[]) => this.emit("close", ...args));
		readable.on("data", (data) => this.emit("data", data));
		readable.on("end", () => this.emit("end"));
		readable.on("error", (error) => this.emit("error", error));
		readable.on("readable", () => this.emit("readable"));

		this.on("destroy", () => readable.destroy());
		this.on("pause", () => readable.pause());
		this.on("push", (chunk, encoding) => readable.push(chunk, encoding));
		this.on("resume", () => readable.resume());
		this.on("setEncoding", (encoding) => readable.setEncoding(encoding));
		this.on("unshift", (chunk) => readable.unshift(chunk));
	}

	public createUnique(id: number | "stdout" | "stderr" | "stdin"): ServerActiveEvalHelper {
		return new ServerActiveEvalHelper(this.modules, this.createUniqueEmitter(id), this.fork);
	}
}

/**
 * An event emitter that can store callbacks with IDs in a map so we can pass
 * them back and forth through an active evaluation using those IDs.
 */
export class CallbackEmitter extends EventEmitter {
	private _ae: ActiveEvalHelper | undefined;
	private callbackId = 0;
	private readonly callbacks = new Map<number, Function>();

	public constructor(ae?: ActiveEvalHelper) {
		super();
		if (ae) {
			this.ae = ae;
		}
	}

	protected get ae(): ActiveEvalHelper {
		if (!this._ae) {
			throw new Error("trying to access active evaluation before it has been set");
		}

		return this._ae;
	}

	protected set ae(ae: ActiveEvalHelper) {
		if (this._ae) {
			throw new Error("cannot override active evaluation");
		}
		this._ae = ae;
		this.ae.on("callback", (callbackId, ...args: any[]) => this.runCallback(callbackId, ...args));
	}

	/**
	 * Store the callback and return and ID referencing its location in the map.
	 */
	protected storeCallback(callback?: Function): number | undefined {
		if (!callback) {
			return undefined;
		}

		const callbackId = this.callbackId++;
		this.callbacks.set(callbackId, callback);

		return callbackId;
	}

	/**
	 * Call the function with the specified ID and delete it from the map.
	 * If the ID is undefined or doesn't exist, nothing happens.
	 */
	private runCallback(callbackId?: number, ...args: any[]): void {
		const callback = typeof callbackId !== "undefined" && this.callbacks.get(callbackId);
		if (callback && typeof callbackId !== "undefined") {
			this.callbacks.delete(callbackId);
			callback(...args);
		}
	}
}

/**
 * A writable stream over an active evaluation.
 */
export class ActiveEvalWritable extends CallbackEmitter implements Writable {
	public constructor(ae: ActiveEvalHelper) {
		super(ae);
		// Streams don't have an argument on close but sockets do.
		this.ae.on("close", (...args: any[]) => this.emit("close", ...args));
		this.ae.on("drain", () => this.emit("drain"));
		this.ae.on("error", (error) => this.emit("error", error));
		this.ae.on("finish", () => this.emit("finish"));
		this.ae.on("pipe", () => logger.warn("pipe is not supported"));
		this.ae.on("unpipe", () => logger.warn("unpipe is not supported"));
	}

	public get writable(): boolean { throw new Error("not implemented"); }
	public get writableHighWaterMark(): number { throw new Error("not implemented"); }
	public get writableLength(): number { throw new Error("not implemented"); }
	public _write(): void { throw new Error("not implemented"); }
	public _destroy(): void { throw new Error("not implemented"); }
	public _final(): void { throw new Error("not implemented"); }
	public pipe<T>(): T { throw new Error("not implemented"); }

	public cork(): void { this.ae.emit("cork"); }
	public destroy(): void { this.ae.emit("destroy"); }
	public setDefaultEncoding(encoding: string): this {
		this.ae.emit("setDefaultEncoding", encoding);

		return this;
	}
	public uncork(): void { this.ae.emit("uncork"); }

	public write(chunk: any, encoding?: string | ((error?: Error | null) => void), callback?: (error?: Error | null) => void): boolean {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}

		// Sockets can pass an fd instead of a callback but streams cannot..
		this.ae.emit("write", chunk, encoding, undefined, this.storeCallback(callback));

		// Always true since we can't get this synchronously.
		return true;
	}

	public end(data?: any, encoding?: string | Function, callback?: Function): void {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		this.ae.emit("end", data, encoding, this.storeCallback(callback));
	}
}

/**
 * A readable stream over an active evaluation.
 */
export class ActiveEvalReadable extends CallbackEmitter implements Readable {
	public constructor(ae: ActiveEvalHelper) {
		super(ae);
		this.ae.on("close", () => this.emit("close"));
		this.ae.on("data", (data) => this.emit("data", data));
		this.ae.on("end", () => this.emit("end"));
		this.ae.on("error", (error) => this.emit("error", error));
		this.ae.on("readable", () => this.emit("readable"));
	}

	public get readable(): boolean { throw new Error("not implemented"); }
	public get readableHighWaterMark(): number { throw new Error("not implemented"); }
	public get readableLength(): number { throw new Error("not implemented"); }
	public _read(): void { throw new Error("not implemented"); }
	public read(): any { throw new Error("not implemented"); }
	public isPaused(): boolean { throw new Error("not implemented"); }
	public pipe<T>(): T { throw new Error("not implemented"); }
	public unpipe(): this { throw new Error("not implemented"); }
	public unshift(): this { throw new Error("not implemented"); }
	public wrap(): this { throw new Error("not implemented"); }
	public push(): boolean { throw new Error("not implemented"); }
	public _destroy(): void { throw new Error("not implemented"); }
	public [Symbol.asyncIterator](): AsyncIterableIterator<any> { throw new Error("not implemented"); }

	public destroy(): void { this.ae.emit("destroy"); }
	public pause(): this { return this.emitReturnThis("pause"); }
	public resume(): this { return this.emitReturnThis("resume"); }
	public setEncoding(encoding?: string): this { return this.emitReturnThis("setEncoding", encoding); }

	// tslint:disable-next-line no-any
	protected emitReturnThis(event: string, ...args: any[]): this {
		this.ae.emit(event, ...args);

		return this;
	}
}

/**
 * An duplex stream over an active evaluation.
 */
export class ActiveEvalDuplex extends ActiveEvalReadable implements Duplex {
	// Some unfortunate duplication here since we can't have multiple extends.
	public constructor(ae: ActiveEvalHelper) {
		super(ae);
		this.ae.on("drain", () => this.emit("drain"));
		this.ae.on("finish", () => this.emit("finish"));
		this.ae.on("pipe", () => logger.warn("pipe is not supported"));
		this.ae.on("unpipe", () => logger.warn("unpipe is not supported"));
	}

	public get writable(): boolean { throw new Error("not implemented"); }
	public get writableHighWaterMark(): number { throw new Error("not implemented"); }
	public get writableLength(): number { throw new Error("not implemented"); }
	public _write(): void { throw new Error("not implemented"); }
	public _destroy(): void { throw new Error("not implemented"); }
	public _final(): void { throw new Error("not implemented"); }
	public pipe<T>(): T { throw new Error("not implemented"); }

	public cork(): void { this.ae.emit("cork"); }
	public destroy(): void { this.ae.emit("destroy"); }
	public setDefaultEncoding(encoding: string): this {
		this.ae.emit("setDefaultEncoding", encoding);

		return this;
	}
	public uncork(): void { this.ae.emit("uncork"); }

	public write(chunk: any, encoding?: string | ((error?: Error | null) => void), callback?: (error?: Error | null) => void): boolean {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}

		// Sockets can pass an fd instead of a callback but streams cannot..
		this.ae.emit("write", chunk, encoding, undefined, this.storeCallback(callback));

		// Always true since we can't get this synchronously.
		return true;
	}

	public end(data?: any, encoding?: string | Function, callback?: Function): void {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		this.ae.emit("end", data, encoding, this.storeCallback(callback));
	}
}
