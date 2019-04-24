import { EventEmitter } from "events";
import { isPromise, EventCallback } from "./util";

// tslint:disable no-any

/**
 * Allow using a proxy like it's returned synchronously. This only works because
 * all proxy methods must return promises.
 */
const unpromisify = <T extends ClientServerProxy>(proxyPromise: Promise<T>): T => {
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
 * Client-side emitter that just forwards server proxy events to its own
 * emitter. It also turns a promisified server proxy into a non-promisified
 * proxy so we don't need a bunch of `then` calls everywhere.
 */
export abstract class ClientProxy<T extends ClientServerProxy> extends EventEmitter {
	private _proxy: T;

	/**
	 * You can specify not to bind events in order to avoid emitting twice for
	 * duplex streams.
	 */
	public constructor(
		private _proxyPromise: Promise<T> | T,
		private readonly bindEvents: boolean = true,
	) {
		super();
		this._proxy = this.initialize(this._proxyPromise);
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

	/**
	 * Remove an event listener.
	 */
	public off(event: string, cb: (...args: any[]) => void): this {
		// Fill it here because the fill we're using to provide EventEmitter for the
		// browser doesn't appear to include `off`.
		this.removeListener(event, cb);

		return this;
	}

	/**
	 * Bind the event locally and ensure the event is bound on the server.
	 */
	public addListener(event: string, listener: (...args: any[]) => void): this {
		this.catch(this.proxy.bindDelayedEvent(event));

		return super.on(event, listener);
	}

	/**
	 * Alias for `addListener`.
	 */
	public on(event: string, listener: (...args: any[]) => void): this {
		return this.addListener(event, listener);
	}

	/**
	 * Original promise for the server proxy. Can be used to be passed as an
	 * argument.
	 */
	public get proxyPromise(): Promise<T> | T {
		return this._proxyPromise;
	}

	/**
	 * Server proxy.
	 */
	protected get proxy(): T {
		return this._proxy;
	}

	/**
	 * Initialize the proxy by unpromisifying if necessary and binding to its
	 * events.
	 */
	protected initialize(proxyPromise: Promise<T> | T): T {
		this._proxyPromise = proxyPromise;
		this._proxy = isPromise(this._proxyPromise)
			? unpromisify(this._proxyPromise)
			: this._proxyPromise;
		if (this.bindEvents) {
			this.proxy.onEvent((event, ...args): void => {
				this.emit(event, ...args);
			});
		}

		return this._proxy;
	}

	/**
	 * Perform necessary cleanup on disconnect (or reconnect).
	 */
	protected abstract handleDisconnect(): void;

	/**
	 * Emit an error event if the promise errors.
	 */
	protected catch(promise?: Promise<any>): this {
		if (promise) {
			promise.catch((e) => this.emit("error", e));
		}

		return this;
	}
}

export interface ServerProxyOptions<T> {
	/**
	 * The events to bind immediately.
	 */
	bindEvents: string[];
	/**
	 * Events that signal the proxy is done.
	 */
	doneEvents: string[];
	/**
	 * Events that should only be bound when asked
	 */
	delayedEvents?: string[];
	/**
	 * Whatever is emitting events (stream, child process, etc).
	 */
	instance: T;
}

/**
 * The actual proxy instance on the server. Every method must only accept
 * serializable arguments and must return promises with serializable values.
 *
 * If a proxy itself has proxies on creation (like how ChildProcess has stdin),
 * then it should return all of those at once, otherwise you will miss events
 * from those child proxies and fail to dispose them properly.
 *
 * Events listeners are added client-side (since all events automatically
 * forward to the client), so onDone and onEvent do not need to be asynchronous.
 */
export abstract class ServerProxy<T extends EventEmitter = EventEmitter> {
	public readonly instance: T;

	private readonly callbacks = <EventCallback[]>[];

	public constructor(private readonly options: ServerProxyOptions<T>) {
		this.instance = options.instance;
	}

	/**
	 * Dispose the proxy.
	 */
	public async dispose(): Promise<void> {
		this.instance.removeAllListeners();
	}

	/**
	 * This is used instead of an event to force it to be implemented since there
	 * would be no guarantee the implementation would remember to emit the event.
	 */
	public onDone(cb: () => void): void {
		this.options.doneEvents.forEach((event) => {
			this.instance.on(event, cb);
		});
	}

	/**
	 * Bind an event that will not fire without first binding it and shouldn't be
	 * bound immediately.

	 * For example, binding to `data` switches a stream to flowing mode, so we
	 * don't want to do it until we're asked. Otherwise something like `pipe`
	 * won't work because potentially some or all of the data will already have
	 * been flushed out.
	 */
	public async bindDelayedEvent(event: string): Promise<void> {
		if (this.options.delayedEvents
				&& this.options.delayedEvents.includes(event)
				&& !this.options.bindEvents.includes(event)) {
			this.options.bindEvents.push(event);
			this.callbacks.forEach((cb) => {
				this.instance.on(event, (...args: any[]) => cb(event, ...args));
			});
		}
	}

	/**
	 * Listen to all possible events. On the client, this is to reduce boilerplate
	 * that would just be a bunch of error-prone forwarding of each individual
	 * event from the proxy to its own emitter.
	 *
	 * It also fixes a timing issue because we just always send all events from
	 * the server, so we never miss any due to listening too late.
	 *
	 * This cannot be async because then we can bind to the events too late.
	 */
	public onEvent(cb: EventCallback): void {
		this.callbacks.push(cb);
		this.options.bindEvents.forEach((event) => {
			this.instance.on(event, (...args: any[]) => cb(event, ...args));
		});
	}
}

/**
 * A server-side proxy stored on the client. The proxy ID only exists on the
 * client-side version of the server proxy. The event listeners are handled by
 * the client and the remaining methods are proxied to the server.
 */
export interface ClientServerProxy<T extends EventEmitter = EventEmitter> extends ServerProxy<T> {
	proxyId: number | Module;
}

/**
 * Supported top-level module proxies.
 */
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
		private readonly maxTime: number = 1000,
		/**
		 * Flush after reaching this count.
		 */
		private readonly maxCount: number = 100,
		/**
		 * Flush after not receiving more requests for this amount of time.
		 * This is pretty low by default so essentially we just end up batching
		 * requests that are all made at the same time.
		 */
		private readonly idleTime: number = 1,
	) {}

	public add = (args: A): Promise<T> => {
		return new Promise((resolve, reject): void => {
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

	/**
	 * Perform remote call for a batch.
	 */
	protected abstract remoteCall(batch: A[]): Promise<(T | Error)[]>;

	/**
	 * Flush out the current batch.
	 */
	private readonly flush = (): void => {
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
