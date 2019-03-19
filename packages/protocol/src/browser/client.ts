import { EventEmitter } from "events";
import { PathLike } from "fs";
import { promisify } from "util";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ReadWriteConnection, InitData, OperatingSystem, SharedProcessData } from "../common/connection";
import { FsProxy, DisposableProxy } from "../common/proxy";
import { stringify, parse } from "../common/util";
import { Ping, ServerMessage, ClientMessage, WorkingInitMessage, MethodMessage, NamedProxyMessage, NumberedProxyMessage, SuccessMessage, FailMessage, EventMessage } from "../proto";
import { Fs } from "./modules";

// `any` is needed to deal with sending and receiving arguments of any type.
// tslint:disable no-any

/**
 * Client accepts an arbitrary connection intended to communicate with the
 * Server.
 */
export class Client {
	private messageId = 0;
	private readonly proxies = new Map<number | string, any>();
	private readonly successEmitter = new Emitter<SuccessMessage>();
	private readonly failEmitter = new Emitter<FailMessage>();
	private readonly eventEmitter = new Emitter<{ event: string; args: any[]; }>();

	private _initData: InitData | undefined;
	private readonly initDataEmitter = new Emitter<InitData>();
	private readonly initDataPromise: Promise<InitData>;

	private readonly sharedProcessActiveEmitter = new Emitter<SharedProcessData>();
	public readonly onSharedProcessActive = this.sharedProcessActiveEmitter.event;
	private readonly isProxySymbol = Symbol("isProxy");

	// The socket timeout is 60s, so we need to send a ping periodically to
	// prevent it from closing.
	private pingTimeout: NodeJS.Timer | number | undefined;
	private readonly pingTimeoutDelay = 30000;

	public readonly modules: {
		fs: Fs,
	};

	/**
	 * @param connection Established connection to the server
	 */
	public constructor(private readonly connection: ReadWriteConnection) {
		connection.onMessage((data) => {
			let message: ServerMessage | undefined;
			try {
				message = ServerMessage.deserializeBinary(data);
				this.handleMessage(message);
			} catch (error) {
				logger.error(
					"Failed to handle server message",
					field("id", message && this.getMessageId(message)),
					field("length", data.byteLength),
					field("error", error.message),
				);
			}
		});

		const fsProxy = <FsProxy>this.createProxy("fs");
		this.modules = {
			fs: new Fs(fsProxy),
		};

		// Methods that don't follow the standard callback pattern (an error
		// followed by a single result) need to provide a custom promisify function.
		Object.defineProperty(this.modules.fs.exists, promisify.custom, {
			value: (path: PathLike): Promise<boolean> => {
				return new Promise((resolve): void => this.modules.fs.exists(path, resolve));
			},
		});

		// We need to know which methods return proxies to return synchronously.
		Object.defineProperty(fsProxy.createWriteStream, this.isProxySymbol, { value: true });
		Object.defineProperty(fsProxy.watch, this.isProxySymbol, { value: true });

		/**
		 * If the connection is interrupted, the calls will neither succeed nor fail
		 * nor exit so we need to send a failure on all of them as well as trigger
		 * events so things like child processes can clean up and possibly restart.
		 */
		const handleDisconnect = (): void => {
			const message = new FailMessage();
			const error = new Error("disconnected");
			message.setResponse(stringify(error));
			this.failEmitter.emit(message);

			this.eventEmitter.emit({ event: "exit", args: [1] });
			this.eventEmitter.emit({ event: "close", args: [] });
			this.eventEmitter.emit({ event: "error", args: [message] });
		};

		connection.onDown(() => handleDisconnect());
		connection.onClose(() => {
			clearTimeout(this.pingTimeout as any);
			this.pingTimeout = undefined;
			handleDisconnect();
		});

		this.initDataPromise = new Promise((resolve): void => {
			this.initDataEmitter.event(resolve);
		});

		this.startPinging();
	}

	/**
	 * Close the connection.
	 */
	public dispose(): void {
		this.connection.close();
	}

	public get initData(): Promise<InitData> {
		return this.initDataPromise;
	}

	/**
	 * Make a remote call for a proxy's method using proto and return either a
	 * proxy or the response using a promise.
	 */
	private remoteCall<T extends object>(proxyId: number | string, proxy: T, method: string, args: any[]): Promise<any> | DisposableProxy {
		const message = new MethodMessage();
		const id = this.messageId++;
		let proxyMessage: NamedProxyMessage | NumberedProxyMessage;
		if (typeof proxyId === "string") {
			proxyMessage = new NamedProxyMessage();
			proxyMessage.setModule(proxyId);
			message.setNamedProxy(proxyMessage);
		} else {
			proxyMessage = new NumberedProxyMessage();
			proxyMessage.setProxyId(proxyId);
			message.setNumberedProxy(proxyMessage);
		}
		proxyMessage.setId(id);
		proxyMessage.setMethod(method);

		logger.trace(() => [
			"sending",
			field("id", id),
			field("proxyId", proxyId),
			field("method", method),
			field("args", args),
		]);

		// The function passed here converts a function into an ID since it's not
		// possible to send functions across as-is. This is used to handle event
		// callbacks.
		proxyMessage.setArgsList(args.map(stringify));

		const clientMessage = new ClientMessage();
		clientMessage.setMethod(message);
		this.connection.send(clientMessage.serializeBinary());

		// The server will send back a fail or success message when the method
		// has completed, so we listen for that based on the message's unique ID.
		const completed = new Promise((resolve, reject): void => {
			const dispose = (): void => {
				d1.dispose();
				d2.dispose();
			};

			const d1 = this.successEmitter.event(id, (message) => {
				dispose();
				resolve(parse(message.getResponse()));
			});

			const d2 = this.failEmitter.event(id, (message) => {
				dispose();
				reject(parse(message.getResponse()));
			});
		});

		// If this method returns a proxy, we need to return it synchronously so it
		// can immediately attach callbacks like "open", otherwise it will attach
		// too late.
		if ((proxy as any)[method][this.isProxySymbol]) {
			return this.createProxy(id);
		}

		return completed;
	}

	/**
	 * Handle all messages from the server.
	 */
	private handleMessage(message: ServerMessage): void {
		if (message.hasInit()) {
			const init = message.getInit()!;
			let opSys: OperatingSystem;
			switch (init.getOperatingSystem()) {
				case WorkingInitMessage.OperatingSystem.WINDOWS:
					opSys = OperatingSystem.Windows;
					break;
				case WorkingInitMessage.OperatingSystem.LINUX:
					opSys = OperatingSystem.Linux;
					break;
				case WorkingInitMessage.OperatingSystem.MAC:
					opSys = OperatingSystem.Mac;
					break;
				default:
					throw new Error(`unsupported operating system ${init.getOperatingSystem()}`);
			}
			this._initData = {
				dataDirectory: init.getDataDirectory(),
				homeDirectory: init.getHomeDirectory(),
				tmpDirectory: init.getTmpDirectory(),
				workingDirectory: init.getWorkingDirectory(),
				os: opSys,
				shell: init.getShell(),
				builtInExtensionsDirectory: init.getBuiltinExtensionsDir(),
			};
			this.initDataEmitter.emit(this._initData);
		} else if (message.hasSuccess()) {
			this.emitSuccess(message.getSuccess()!);
		} else if (message.hasFail()) {
			this.emitFail(message.getFail()!);
		} else if (message.hasEvent()) {
			this.emitEvent(message.getEvent()!);
		} else if (message.hasSharedProcessActive()) {
			const sharedProcessActiveMessage = message.getSharedProcessActive()!;
			this.sharedProcessActiveEmitter.emit({
				socketPath: sharedProcessActiveMessage.getSocketPath(),
				logPath: sharedProcessActiveMessage.getLogPath(),
			});
		} else if (message.hasPong()) {
			// Nothing to do since pings are on a timer rather than waiting for the
			// next pong in case a message from either the client or server is dropped
			// which would break the ping cycle.
		} else {
			throw new Error("unknown message type");
		}
	}

	private emitSuccess(message: SuccessMessage): void {
		logger.trace(() => [
			"received resolve",
			field("id", message.getId()),
		]);

		this.successEmitter.emit(message.getId(), message);
	}

	private emitFail(message: FailMessage): void {
		logger.trace(() => [
			"received reject",
			field("id", message.getId()),
		]);

		this.failEmitter.emit(message.getId(), message);
	}

	/**
	 * Emit an event received from the server. We could send requests for "on" to
	 * the server and serialize functions using IDs, but doing it that way makes
	 * it possible to miss events depending on whether the server receives the
	 * request before it emits. Instead, emit all events from the server so all
	 * events are always caught on the client.
	 */
	private emitEvent(message: EventMessage): void {
		logger.trace(() => [
			"received event",
			field("proxyId", message.getProxyId()),
			field("event", message.getEvent()),
		]);

		this.eventEmitter.emit(message.getProxyId(), {
			event: message.getEvent(),
			args: message.getArgsList().map(parse),
		});
	}

	/**
	 * Start the ping loop. Does nothing if already pinging.
	 */
	private startPinging = (): void => {
		if (typeof this.pingTimeout !== "undefined") {
			return;
		}

		const schedulePing = (): void => {
			this.pingTimeout = setTimeout(() => {
				const clientMsg = new ClientMessage();
				clientMsg.setPing(new Ping());
				this.connection.send(clientMsg.serializeBinary());
				schedulePing();
			}, this.pingTimeoutDelay);
		};

		schedulePing();
	}

	/**
	 * Return the message's ID if it has one or a string identifier. For logging
	 * errors with an ID to make the error more useful.
	 */
	private getMessageId(message: ServerMessage): number | string | undefined {
		if (message.hasInit()) {
			return "init";
		} else if (message.hasSuccess()) {
			return message.getSuccess()!.getId();
		} else if (message.hasFail()) {
			return message.getFail()!.getId();
		} else if (message.hasEvent()) {
			return `${message.getEvent()!.getProxyId()}: ${message.getEvent()!.getEvent()}`;
		} else if (message.hasSharedProcessActive()) {
			return "shared";
		} else if (message.hasPong()) {
			return "pong";
		}
	}

	/**
	 * Return a proxy that makes remote calls.
	 */
	private createProxy<T>(id: number | string): T {
		logger.trace(() => [
			"creating proxy",
			field("proxyId", id),
		]);

		const eventEmitter = new EventEmitter();
		const proxy = new Proxy({
			id,
			onDidDispose: (cb: () => void): void => {
				eventEmitter.on("dispose", cb);
			},
			on: (event: string, cb: (...args: any[]) => void): void => {
				eventEmitter.on(event, cb);
			},
		}, {
			get: (target: any, name: string): any => {
				if (typeof target[name] === "undefined") {
					target[name] = (...args: any[]): Promise<any> | DisposableProxy => {
						return this.remoteCall(id, proxy, name, args);
					};
				}

				return target[name];
			},
		});

		this.proxies.set(id, proxy);
		this.eventEmitter.event(id, (event) => {
			eventEmitter.emit(event.event, ...event.args);
		});

		proxy.onDidDispose(() => {
			logger.trace(() => [
				"disposing proxy",
				field("proxyId", id),
			]);
			this.proxies.delete(id);
			this.eventEmitter.dispose(id);
		});

		return proxy;
	}
}
