import { SpawnOptions, ForkOptions } from "child_process";
import { EventEmitter } from "events";
import { Socket } from "net";
import { Duplex, Readable, Writable } from "stream";
import { logger } from "@coder/logger";
import { ActiveEval, Disposer } from "@coder/protocol";

// tslint:disable no-any
/**
 * If there is a callback ID, return a function that emits the callback event on
 * the active evaluation with that ID and all arguments passed to it. Otherwise,
 * return undefined.
 */
export const maybeCallback = (ae: ActiveEval, callbackId?: number): ((...args: any[])  => void) | undefined => {
	return typeof callbackId !== "undefined" ? (...args: any[]): void => {
		ae.emit("callback", callbackId, ...args);
	} : undefined;
};

// Some spawn code tries to preserve the env (the debug adapter for
// instance) but the env is mostly blank (since we're in the browser), so
// we'll just always preserve the main process.env here, otherwise it
// won't have access to PATH, etc.
// TODO: An alternative solution would be to send the env to the browser?
export const preserveEnv = (options: SpawnOptions | ForkOptions): void => {
	if (options && options.env) {
		options.env = { ...process.env, ...options.env };
	}
};

/**
 * Bind a socket to an active evaluation.
 */
export const bindSocket = (ae: ActiveEval, socket: Socket): Disposer => {
	socket.on("connect", () => ae.emit("connect"));
	socket.on("lookup", (error, address, family, host) => ae.emit("lookup", error, address, family, host));
	socket.on("timeout", () => ae.emit("timeout"));

	ae.on("connect", (options, callbackId) => socket.connect(options, maybeCallback(ae, callbackId)));
	ae.on("ref", () => socket.ref());
	ae.on("setKeepAlive", (enable, initialDelay) => socket.setKeepAlive(enable, initialDelay));
	ae.on("setNoDelay", (noDelay) => socket.setNoDelay(noDelay));
	ae.on("setTimeout", (timeout, callbackId) => socket.setTimeout(timeout, maybeCallback(ae, callbackId)));
	ae.on("unref", () => socket.unref());

	bindReadable(ae, socket);
	bindWritable(ae, socket);

	return {
		onDidDispose: (cb): Socket => socket.on("close", cb),
		dispose: (): void => {
			socket.removeAllListeners();
			socket.end();
			socket.destroy();
			socket.unref();
		},
	};
};

/**
 * Bind a writable stream to an active evaluation.
 */
export const bindWritable = (ae: ActiveEval, writable: Writable | Duplex): void => {
	if (!((writable as Readable).read)) { // To avoid binding twice.
		writable.on("close", () => ae.emit("close"));
		writable.on("error", (error) => ae.emit("error", error));

		ae.on("destroy", () => writable.destroy());
	}

	writable.on("drain", () => ae.emit("drain"));
	writable.on("finish", () => ae.emit("finish"));
	writable.on("pipe", () => ae.emit("pipe"));
	writable.on("unpipe", () => ae.emit("unpipe"));

	ae.on("cork", () => writable.cork());
	ae.on("end", (chunk, encoding, callbackId) => writable.end(chunk, encoding, maybeCallback(ae, callbackId)));
	ae.on("setDefaultEncoding", (encoding) => writable.setDefaultEncoding(encoding));
	ae.on("uncork", () => writable.uncork());
	// Sockets can pass an fd instead of a callback but streams cannot.
	ae.on("write", (chunk, encoding, fd, callbackId) => writable.write(chunk, encoding, maybeCallback(ae, callbackId) || fd));
};

/**
 * Bind a readable stream to an active evaluation.
 */
export const bindReadable = (ae: ActiveEval, readable: Readable): void => {
	// Streams don't have an argument on close but sockets do.
	readable.on("close", (...args: any[]) => ae.emit("close", ...args));
	readable.on("data", (data) => ae.emit("data", data));
	readable.on("end", () => ae.emit("end"));
	readable.on("error", (error) => ae.emit("error", error));
	readable.on("readable", () => ae.emit("readable"));

	ae.on("destroy", () => readable.destroy());
	ae.on("pause", () => readable.pause());
	ae.on("push", (chunk, encoding) => readable.push(chunk, encoding));
	ae.on("resume", () => readable.resume());
	ae.on("setEncoding", (encoding) => readable.setEncoding(encoding));
	ae.on("unshift", (chunk) => readable.unshift(chunk));
};

/**
 * Wrap an evaluation emitter to make unique events for an item to prevent
 * conflicts when it shares that emitter with other items.
 */
export const createUniqueEval = (ae: ActiveEval, id: number | "stdout" | "stderr" | "stdin"): ActiveEval => {
	let events = <string[]>[];

	return {
		removeAllListeners: (event?: string): void => {
			if (!event) {
				events.forEach((e) => ae.removeAllListeners(e));
				events = [];
			} else {
				const index = events.indexOf(event);
				if (index !== -1) {
					events.splice(index, 1);
					ae.removeAllListeners(`${event}:${id}`);
				}
			}
		},
		emit: (event: string, ...args: any[]): void => {
			ae.emit(`${event}:${id}`, ...args);
		},
		on: (event: string, cb: (...args: any[]) => void): void => {
			if (!events.includes(event)) {
				events.push(event);
			}
			ae.on(`${event}:${id}`, cb);
		},
	};
};

/**
 * An event emitter that can store callbacks with IDs in a map so we can pass
 * them back and forth through an active evaluation using those IDs.
 */
export class CallbackEmitter extends EventEmitter {
	private _ae: ActiveEval | undefined;
	private callbackId = 0;
	private readonly callbacks = new Map<number, Function>();

	public constructor(ae?: ActiveEval) {
		super();
		if (ae) {
			this.ae = ae;
		}
	}

	protected get ae(): ActiveEval {
		if (!this._ae) {
			throw new Error("trying to access active evaluation before it has been set");
		}

		return this._ae;
	}

	protected set ae(ae: ActiveEval) {
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
	public constructor(ae: ActiveEval) {
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
	public constructor(ae: ActiveEval) {
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
	public constructor(ae: ActiveEval) {
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
