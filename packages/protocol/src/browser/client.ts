import { PathLike } from "fs";
import { ExecException, ExecOptions } from "child_process";
import { promisify } from "util";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ReadWriteConnection, InitData, SharedProcessData } from "../common/connection";
import { Module, ServerProxy } from "../common/proxy";
import { stringify, parse, moduleToProto, protoToModule, protoToOperatingSystem } from "../common/util";
import { Ping, ServerMessage, ClientMessage, MethodMessage, NamedProxyMessage, NumberedProxyMessage, SuccessMessage, FailMessage, EventMessage, CallbackMessage } from "../proto";
import { FsModule, ChildProcessModule, NetModule, NodePtyModule, SpdlogModule, TrashModule } from "./modules";

// tslint:disable no-any

interface ProxyData {
	promise: Promise<void>;
	instance: any;
	callbacks: Map<number, (...args: any[]) => void>;
}

/**
 * Client accepts a connection to communicate with the server.
 */
export class Client {
	private messageId = 0;
	private callbackId = 0;
	private readonly proxies = new Map<number | Module, ProxyData>();
	private readonly successEmitter = new Emitter<SuccessMessage>();
	private readonly failEmitter = new Emitter<FailMessage>();
	private readonly eventEmitter = new Emitter<{ event: string; args: any[]; }>();

	private _initData: InitData | undefined;
	private readonly initDataEmitter = new Emitter<InitData>();
	private readonly initDataPromise: Promise<InitData>;

	private readonly sharedProcessActiveEmitter = new Emitter<SharedProcessData>();
	public readonly onSharedProcessActive = this.sharedProcessActiveEmitter.event;

	private disconnected: boolean = false;

	// The socket timeout is 60s, so we need to send a ping periodically to
	// prevent it from closing.
	private pingTimeout: NodeJS.Timer | number | undefined;
	private readonly pingTimeoutDelay = 30000;

	private readonly responseTimeout = 10000;

	public readonly modules: {
		[Module.ChildProcess]: ChildProcessModule,
		[Module.Fs]: FsModule,
		[Module.Net]: NetModule,
		[Module.NodePty]: NodePtyModule,
		[Module.Spdlog]: SpdlogModule,
		[Module.Trash]: TrashModule,
	};

	/**
	 * @param connection Established connection to the server
	 */
	public constructor(private readonly connection: ReadWriteConnection) {
		connection.onMessage(async (data) => {
			let message: ServerMessage | undefined;
			try {
				message = ServerMessage.deserializeBinary(data);
				await this.handleMessage(message);
			} catch (error) {
				logger.error(
					"Failed to handle server message",
					field("id", message && this.getMessageId(message)),
					field("length", data.byteLength),
					field("error", error.message),
				);
			}
		});

		this.createProxy(Module.ChildProcess);
		this.createProxy(Module.Fs);
		this.createProxy(Module.Net);
		this.createProxy(Module.NodePty);
		this.createProxy(Module.Spdlog);
		this.createProxy(Module.Trash);

		this.modules = {
			[Module.ChildProcess]: new ChildProcessModule(this.getProxy(Module.ChildProcess).instance),
			[Module.Fs]: new FsModule(this.getProxy(Module.Fs).instance),
			[Module.Net]: new NetModule(this.getProxy(Module.Net).instance),
			[Module.NodePty]: new NodePtyModule(this.getProxy(Module.NodePty).instance),
			[Module.Spdlog]: new SpdlogModule(this.getProxy(Module.Spdlog).instance),
			[Module.Trash]: new TrashModule(this.getProxy(Module.Trash).instance),
		};

		// Methods that don't follow the standard callback pattern (an error
		// followed by a single result) need to provide a custom promisify function.
		Object.defineProperty(this.modules[Module.Fs].exists, promisify.custom, {
			value: (path: PathLike): Promise<boolean> => {
				return new Promise((resolve): void => this.modules[Module.Fs].exists(path, resolve));
			},
		});

		Object.defineProperty(this.modules[Module.ChildProcess].exec, promisify.custom, {
			value: (
				command: string,
				options?: { encoding?: string | null } & ExecOptions | null,
			): Promise<{ stdout: string | Buffer, stderr: string | Buffer }> => {
				return new Promise((resolve, reject): void => {
					this.modules[Module.ChildProcess].exec(command, options, (error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => {
						if (error) {
							reject(error);
						} else {
							resolve({ stdout, stderr });
						}
					});
				});
			},
		});

		/**
		 * If the connection is interrupted, the calls will neither succeed nor fail
		 * nor exit so we need to send a failure on all of them as well as trigger
		 * events so things like child processes can clean up and possibly restart.
		 */
		const handleDisconnect = (): void => {
			this.disconnected = true;
			logger.trace(() => [
				"disconnected from server",
				field("proxies", this.proxies.size),
				field("callbacks", Array.from(this.proxies.values()).reduce((count, p) => count + p.callbacks.size, 0)),
				field("success listeners", this.successEmitter.counts),
				field("fail listeners", this.failEmitter.counts),
				field("event listeners", this.eventEmitter.counts),
			]);

			const message = new FailMessage();
			const error = new Error("disconnected");
			message.setResponse(stringify(error));
			this.failEmitter.emit(message);

			this.eventEmitter.emit({ event: "disconnected", args: [error] });
			this.eventEmitter.emit({ event: "done", args: [] });
		};

		connection.onDown(() => handleDisconnect());
		connection.onClose(() => {
			clearTimeout(this.pingTimeout as any);
			this.pingTimeout = undefined;
			handleDisconnect();
		});
		connection.onUp(() => this.disconnected = false);

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
	 * Make a remote call for a proxy's method using proto.
	 */
	private remoteCall(proxyId: number | Module, method: string, args: any[]): Promise<any> {
		if (this.disconnected) {
			return Promise.reject(new Error("disconnected"));
		}

		const message = new MethodMessage();
		const id = this.messageId++;
		let proxyMessage: NamedProxyMessage | NumberedProxyMessage;
		if (typeof proxyId === "string") {
			proxyMessage = new NamedProxyMessage();
			proxyMessage.setModule(moduleToProto(proxyId));
			message.setNamedProxy(proxyMessage);
		} else {
			proxyMessage = new NumberedProxyMessage();
			proxyMessage.setProxyId(proxyId);
			message.setNumberedProxy(proxyMessage);
		}
		proxyMessage.setId(id);
		proxyMessage.setMethod(method);

		const storeCallback = (cb: (...args: any[]) => void): number => {
			const callbackId = this.callbackId++;
			logger.trace(() => [
				"storing callback",
				field("proxyId", proxyId),
				field("callbackId", callbackId),
			]);

			this.getProxy(proxyId).callbacks.set(callbackId, cb);

			return callbackId;
		};

		const stringifiedArgs = args.map((a) => stringify(a, storeCallback));
		logger.trace(() => [
			"sending",
			field("id", id),
			field("proxyId", proxyId),
			field("method", method),
			field("args", stringifiedArgs),
		]);

		proxyMessage.setArgsList(stringifiedArgs);

		const clientMessage = new ClientMessage();
		clientMessage.setMethod(message);
		this.connection.send(clientMessage.serializeBinary());

		// The server will send back a fail or success message when the method
		// has completed, so we listen for that based on the message's unique ID.
		const promise =  new Promise((resolve, reject): void => {
			const dispose = (): void => {
				d1.dispose();
				d2.dispose();
				clearTimeout(timeout as any);
			};

			const timeout = setTimeout(() => {
				dispose();
				reject(new Error("timed out"));
			}, this.responseTimeout);

			const d1 = this.successEmitter.event(id, (message) => {
				dispose();
				resolve(this.parse(message.getResponse()));
			});

			const d2 = this.failEmitter.event(id, (message) => {
				dispose();
				reject(parse(message.getResponse()));
			});
		});

		return promise;
	}

	/**
	 * Handle all messages from the server.
	 */
	private async handleMessage(message: ServerMessage): Promise<void> {
		if (message.hasInit()) {
			const init = message.getInit()!;
			this._initData = {
				dataDirectory: init.getDataDirectory(),
				homeDirectory: init.getHomeDirectory(),
				tmpDirectory: init.getTmpDirectory(),
				workingDirectory: init.getWorkingDirectory(),
				os: protoToOperatingSystem(init.getOperatingSystem()),
				shell: init.getShell(),
				builtInExtensionsDirectory: init.getBuiltinExtensionsDir(),
			};
			this.initDataEmitter.emit(this._initData);
		} else if (message.hasSuccess()) {
			this.emitSuccess(message.getSuccess()!);
		} else if (message.hasFail()) {
			this.emitFail(message.getFail()!);
		} else if (message.hasEvent()) {
			await this.emitEvent(message.getEvent()!);
		} else if (message.hasCallback()) {
			await this.runCallback(message.getCallback()!);
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
	private async emitEvent(message: EventMessage): Promise<void> {
		const eventMessage = message.getNamedEvent()! || message.getNumberedEvent()!;
		const proxyId = message.getNamedEvent()
			? protoToModule(message.getNamedEvent()!.getModule())
			: message.getNumberedEvent()!.getProxyId();
		const event = eventMessage.getEvent();
		await this.ensureResolved(proxyId);
		logger.trace(() => [
			"received event",
			field("proxyId", proxyId),
			field("event", event),
			field("args", eventMessage.getArgsList()),
		]);

		const args = eventMessage.getArgsList().map((a) => this.parse(a));
		this.eventEmitter.emit(proxyId, { event, args });
	}

	/**
	 * Run a callback as requested by the server. Since we don't know when
	 * callbacks get garbage collected we dispose them only when the proxy
	 * disposes. That means they should only be used if they run for the lifetime
	 * of the proxy (like child_process.exec), otherwise we'll leak. They should
	 * also only be used when passed together with the method. If they are sent
	 * afterward, they may never be called due to timing issues.
	 */
	private async runCallback(message: CallbackMessage): Promise<void> {
		const callbackMessage = message.getNamedCallback()! || message.getNumberedCallback()!;
		const proxyId = message.getNamedCallback()
			? protoToModule(message.getNamedCallback()!.getModule())
			: message.getNumberedCallback()!.getProxyId();
		const callbackId = callbackMessage.getCallbackId();
		await this.ensureResolved(proxyId);
		logger.trace(() => [
			"running callback",
			field("proxyId", proxyId),
			field("callbackId", callbackId),
			field("args", callbackMessage.getArgsList()),
		]);
		const args = callbackMessage.getArgsList().map((a) => this.parse(a));
		this.getProxy(proxyId).callbacks.get(callbackId)!(...args);
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
			const eventMessage = message.getEvent()!.getNamedEvent()!
				|| message.getEvent()!.getNumberedEvent()!;

			return `event: ${eventMessage.getEvent()}`;
		} else if (message.hasCallback()) {
			const callbackMessage = message.getCallback()!.getNamedCallback()!
				|| message.getCallback()!.getNumberedCallback()!;

			return `callback: ${callbackMessage.getCallbackId()}`;
		} else if (message.hasSharedProcessActive()) {
			return "shared";
		} else if (message.hasPong()) {
			return "pong";
		}
	}

	/**
	 * Return a proxy that makes remote calls.
	 */
	private createProxy<T>(proxyId: number | Module, promise: Promise<any> = Promise.resolve()): T {
		logger.trace(() => [
			"creating proxy",
			field("proxyId", proxyId),
		]);

		const instance = new Proxy({
			proxyId,
			onDone: (cb: (...args: any[]) => void): void => {
				this.eventEmitter.event(proxyId, (event) => {
					if (event.event === "done") {
						cb(...event.args);
					}
				});
			},
			onEvent: (cb: (event: string, ...args: any[]) => void): void => {
				this.eventEmitter.event(proxyId, (event) => {
					cb(event.event, ...event.args);
				});
			},
		}, {
			get: (target: any, name: string): any => {
				// When resolving a promise with a proxy, it will check for "then".
				if (name === "then") {
					return;
				}

				if (typeof target[name] === "undefined") {
					target[name] = (...args: any[]): Promise<any> | ServerProxy => {
						return this.remoteCall(proxyId, name, args);
					};
				}

				return target[name];
			},
		});

		this.proxies.set(proxyId, {
			promise,
			instance,
			callbacks: new Map(),
		});

		instance.onDone(() => {
			const log = (): void => {
				logger.trace(() => [
					typeof proxyId === "number" ? "disposed proxy" : "disposed proxy callbacks",
					field("proxyId", proxyId),
					field("disconnected", this.disconnected),
					field("callbacks", Array.from(this.proxies.values()).reduce((count, proxy) => count + proxy.callbacks.size, 0)),
					field("success listeners", this.successEmitter.counts),
					field("fail listeners", this.failEmitter.counts),
					field("event listeners", this.eventEmitter.counts),
				]);
			};

			// Uniquely identified items (top-level module proxies) can continue to
			// be used so we don't need to delete them.
			if (typeof proxyId === "number") {
				const dispose = (): void => {
					this.proxies.delete(proxyId);
					this.eventEmitter.dispose(proxyId);
					log();
				};
				if (!this.disconnected) {
					instance.dispose().then(dispose).catch(dispose);
				} else {
					dispose();
				}
			} else {
				// The callbacks will still be unusable though.
				this.getProxy(proxyId).callbacks.clear();
				log();
			}
		});

		return instance;
	}

	/**
	 * We aren't guaranteed the promise will call all the `then` callbacks
	 * synchronously once it resolves, so the event message can come in and fire
	 * before a caller has been able to attach an event. Waiting for the promise
	 * ensures it runs after everything else.
	 */
	private async ensureResolved(proxyId: number | Module): Promise<void> {
		await this.getProxy(proxyId).promise;
	}

	private parse(value?: string, promise?: Promise<any>): any {
		return parse(value, undefined, (id) => this.createProxy(id, promise));
	}

	private getProxy(proxyId: number | Module): ProxyData {
		if (!this.proxies.has(proxyId)) {
			throw new Error(`proxy ${proxyId} disposed too early`);
		}

		return this.proxies.get(proxyId)!;
	}
}
