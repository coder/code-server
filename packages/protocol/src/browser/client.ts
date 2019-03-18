import { PathLike } from "fs";
import { promisify } from "util";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ReadWriteConnection, InitData, OperatingSystem, SharedProcessData } from "../common/connection";
import { FsProxy, DisposableProxy } from "../common/proxy";
import { stringify, parse } from "../common/util";
import { Ping, ServerMessage, ClientMessage, WorkingInitMessage, MethodMessage, NamedProxyMessage, NumberedProxyMessage, SuccessMessage, FailMessage, CallbackMessage } from "../proto";
import { Fs } from "./modules";

// `any` is needed to deal with sending and receiving arguments of any type.
// tslint:disable no-any

/**
 * Client accepts an arbitrary connection intended to communicate with the
 * Server.
 */
export class Client {
	private messageId = 0;
	private readonly successEmitter = new Emitter<SuccessMessage>();
	private readonly failEmitter = new Emitter<FailMessage>();

	// Callbacks are grouped by proxy so we can clear them when a proxy disposes.
	private callbackId = 0;
	private readonly callbacks = new Map<number | string, Map<number, {
		event?: string;
		callback: (...args: any[]) => void;
	}>>();

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
			this.callbacks.forEach((cbs) => {
				cbs.forEach((cb) => {
					switch (cb.event) {
						case "exit":
						case "close":
							cb.callback(1);
							break;
						case "error":
							cb.callback(error);
							break;
					}
				});
			});
			this.callbacks.clear();
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
		proxyMessage.setArgsList(args.map((a) => stringify(a, (cb) => {
			const callbackId = this.callbackId++;
			const event = method === "on" ? args[0] : undefined;
			// Using ! because non-existence is an error that should throw.
			logger.trace(() => [
				"registering callback",
				field("event", event),
				field("proxyId", proxyId),
				field("callbackId", callbackId),
			]);
			this.callbacks.get(proxyId)!.set(callbackId, {
				event,
				callback: cb,
			});

			return callbackId;
		})));

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

			const d1 = this.successEmitter.event(id, (doneMessage) => {
				dispose();
				logger.trace(() => [
					"received resolve",
					field("id", id),
				]);
				resolve(parse(doneMessage.getResponse()));
			});

			const d2 = this.failEmitter.event(id, (failedMessage) => {
				dispose();
				logger.trace(() => [
					"received resolve",
					field("id", id),
				]);
				reject(parse(failedMessage.getResponse()));
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
			this.successEmitter.emit(message.getSuccess()!.getId(), message.getSuccess()!);
		} else if (message.hasFail()) {
			this.failEmitter.emit(message.getFail()!.getId(), message.getFail()!);
		} else if (message.hasCallback()) {
			this.runCallback(message.getCallback()!);
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

	/**
	 * Run a callback.
	 */
	private runCallback(message: CallbackMessage): void {
		// Using ! because non-existence is an error that should throw.
		logger.trace(() => [
			"received callback",
			field("proxyId", message.getProxyId()),
			field("callbackId", message.getCallbackId()),
		]);
		this.callbacks.get(message.getProxyId())!.get(message.getCallbackId())!.callback(
			...message.getArgsList().map((a) => parse(a)),
		);
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
		} else if (message.hasCallback()) {
			return message.getCallback()!.getCallbackId();
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

		this.callbacks.set(id, new Map());

		const proxy = new Proxy({ id }, {
			get: (target: any, name: string): any => {
				if (typeof target[name] === "undefined") {
					target[name] = (...args: any[]): Promise<any> | DisposableProxy => {
						return this.remoteCall(id, proxy, name, args);
					};
				}

				return target[name];
			},
		});

		// Modules don't get disposed but everything else does.
		if (typeof id !== "string") {
			proxy.onDidDispose(() => {
				// Don't dispose immediately because there might still be callbacks
				// to run, especially if the dispose is on the same or earlier event
				// than the callback is on.
				setTimeout(() => {
					logger.trace(() => [
						"disposing proxy",
						field("proxyId", id),
					]);
					this.callbacks.delete(id);
				}, 1000);
		});
		}

		return proxy;
	}
}
