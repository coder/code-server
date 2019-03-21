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
	protected readonly proxy: T;

	/**
	 * You can specify not to bind events in order to avoid emitting twice for
	 * duplex streams.
	 */
	public constructor(proxyPromise: Promise<T> | T, bindEvents: boolean = true) {
		super();
		this.proxy = isPromise(proxyPromise) ? unpromisify(proxyPromise) : proxyPromise;
		if (bindEvents) {
			this.proxy.onEvent((event, ...args): void => {
				this.emit(event, ...args);
			});
		}
	}
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
