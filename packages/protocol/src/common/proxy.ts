import { EventEmitter } from "events";
import { isPromise } from "./util";

// tslint:disable no-any

/**
 * Allow using a proxy like it's returned synchronously. This only works because
 * all proxy methods return promises.
 */
const unpromisify = <T extends ServerProxy>(proxyPromise: Promise<T>): T => {
	return new Proxy({}, {
		get: (target: any, name: string): any => {
			if (typeof target[name] === "undefined") {
				target[name] = async (...args: any[]): Promise<any> => {
					const proxy = await proxyPromise;

					return proxy ? (proxy as any)[name](...args) : undefined;
				};
			}

			return target[name];
		},
	});
};

/**
 * Client-side emitter that just forwards proxy events to its own emitter.
 * It also turns a promisified proxy into a non-promisified proxy so we don't
 * need a bunch of `then` calls everywhere.
 */
export abstract class ClientProxy<T extends ServerProxy> extends EventEmitter {
	private _proxy: T | undefined;

	/**
	 * You can specify not to bind events in order to avoid emitting twice for
	 * duplex streams.
	 */
	public constructor(
		proxyPromise: Promise<T> | T,
		private readonly bindEvents: boolean = true,
	) {
		super();
		this.initialize(proxyPromise);
		if (this.bindEvents) {
			this.on("disconnected", (error) => {
				try {
					this.emit("error", error);
				} catch (error) {
					// If nothing is listening, EventEmitter will throw an error.
				}
				this.handleDisconnect();
			});
		}
	}

	protected get proxy(): T {
		if (!this._proxy) {
			throw new Error("not initialized");
		}

		return this._proxy;
	}

	protected initialize(proxyPromise: Promise<T> | T): void {
		this._proxy = isPromise(proxyPromise) ? unpromisify(proxyPromise) : proxyPromise;
		if (this.bindEvents) {
			this.proxy.onEvent((event, ...args): void => {
				this.emit(event, ...args);
			});
		}
	}

	protected abstract handleDisconnect(): void;
}

/**
 * Proxy to the actual instance on the server. Every method must only accept
 * serializable arguments and must return promises with serializable values. If
 * a proxy itself has proxies on creation (like how ChildProcess has stdin),
 * then it should return all of those at once, otherwise you will miss events
 * from those child proxies and fail to dispose them properly.
 */
export interface ServerProxy {
	dispose(): Promise<void>;

	/**
	 * This is used instead of an event to force it to be implemented since there
	 * would be no guarantee the implementation would remember to emit the event.
	 */
	onDone(cb: () => void): Promise<void>;

	/**
	 * Listen to all possible events. On the client, this is to reduce boilerplate
	 * that would just be a bunch of error-prone forwarding of each individual
	 * event from the proxy to its own emitter. It also fixes a timing issue
	 * because we just always send all events from the server, so we never miss
	 * any due to listening too late.
	 */
	// tslint:disable-next-line no-any
	onEvent(cb: (event: string, ...args: any[]) => void): Promise<void>;
}

export enum Module {
	Fs = "fs",
	ChildProcess = "child_process",
	Net = "net",
	Spdlog = "spdlog",
	NodePty = "node-pty",
	Trash = "trash",
}

interface BatchItem<T, A> {
	args: A;
	resolve: (t: T) => void;
	reject: (e: Error) => void;
}

/**
 * Batch remote calls.
 */
export abstract class Batch<T, A> {
	private idleTimeout: number | NodeJS.Timer | undefined;
	private maxTimeout: number | NodeJS.Timer | undefined;
	private batch = <BatchItem<T, A>[]>[];

	public constructor(
		/**
		 * Flush after reaching this amount of time.
		 */
		private readonly maxTime = 1000,
		/**
		 * Flush after reaching this count.
		 */
		private readonly maxCount = 100,
		/**
		 * Flush after not receiving more requests for this amount of time.
		 */
		private readonly idleTime = 100,
	) {}

	public add = (args: A): Promise<T> => {
		return new Promise((resolve, reject) => {
			this.batch.push({
				args,
				resolve,
				reject,
			});
			if (this.batch.length >= this.maxCount) {
				this.flush();
			} else {
				clearTimeout(this.idleTimeout as any);
				this.idleTimeout = setTimeout(this.flush, this.idleTime);
				if (typeof this.maxTimeout === "undefined") {
					this.maxTimeout = setTimeout(this.flush, this.maxTime);
				}
			}
		});
	}

	protected abstract remoteCall(batch: A[]): Promise<(T | Error)[]>;

	private flush = (): void => {
		clearTimeout(this.idleTimeout as any);
		clearTimeout(this.maxTimeout as any);
		this.maxTimeout = undefined;

		const batch = this.batch;
		this.batch = [];

		this.remoteCall(batch.map((q) => q.args)).then((results) => {
			batch.forEach((item, i) => {
				const result = results[i];
				if (result && result instanceof Error) {
					item.reject(result);
				} else {
					item.resolve(result);
				}
			});
		}).catch((error) => batch.forEach((item) => item.reject(error)));
	}
}
