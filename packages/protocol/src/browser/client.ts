import { PathLike } from "fs";
import { promisify } from "util";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ReadWriteConnection, InitData, OperatingSystem, SharedProcessData } from "../common/connection";
import { stringify, parse, createProxy, isProxy } from "../common/util";
import { Ping, ServerMessage, ClientMessage, WorkingInitMessage, MethodMessage, SuccessMessage, FailMessage, CallbackMessage } from "../proto";
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
	private readonly callbacks = new Map<number, Map<number, {
		event?: string;
		callback: (...args: any[]) => void;
	}>>();

	private _initData: InitData | undefined;
	private readonly initDataEmitter = new Emitter<InitData>();
	private readonly initDataPromise: Promise<InitData>;

	private readonly sharedProcessActiveEmitter = new Emitter<SharedProcessData>();
	public readonly onSharedProcessActive = this.sharedProcessActiveEmitter.event;

	// The socket timeout is 60s, so we need to send a ping periodically to
	// prevent it from closing.
	private pingTimeout: NodeJS.Timer | number | undefined;
	private readonly pingTimeoutDelay = 30000;

	public readonly modules = {
		fs: new Fs(createProxy((name, args) => {
			return this.remoteCall(name, args, "fs");
		})),
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

		// Methods that don't follow the standard callback pattern (an error followed
		// by a single result) need to provide a custom promisify function.
		Object.defineProperty(this.modules.fs.exists, promisify.custom, {
			value: (path: PathLike): Promise<boolean> => {
				return new Promise((resolve): void => this.modules.fs.exists(path, resolve));
			},
		});

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
	 * Make a remote call for a proxy's method using proto and return the
	 * response using a promise. Bound so it can be passed directly to `parse`.
	 */
	private remoteCall = (method: string, args: any[], moduleNameOrProxyId: string | number): Promise<any> => {
		const proxyMessage = new MethodMessage();
		const id = this.messageId++;
		proxyMessage.setId(id);
		proxyMessage.setMethod(method);

		// The call will either be for a module proxy (accessed by name since it is
		// unique) or for a proxy returned by one of the module's methods (accessed
		// by ID since it is not unique).
		const callbacks = new Map();
		if (typeof moduleNameOrProxyId === "number") {
			this.callbacks.set(moduleNameOrProxyId, callbacks);
			proxyMessage.setProxyId(moduleNameOrProxyId);
		} else {
			proxyMessage.setModule(moduleNameOrProxyId);
		}

		// Must stringify the arguments. The function passed converts a function
		// into an ID since it's not possible to send functions across as-is.
		let nextCallbackId = 0;
		proxyMessage.setArgsList(args.map((a) => stringify(a, (cb) => {
			const callbackId = nextCallbackId++;
			// Using ! because non-existence is an error that should throw.
			callbacks.set(callbackId, {
				event: method === "on" ? args[0] : undefined,
				callback: cb,
			});

			return callbackId;
		})));

		// The server will send back a fail or success message when the method
		// has completed, so we listen for that based on the message's unique ID.
		const completed = new Promise((resolve, reject): void => {
			const dispose = (): void => {
				d1.dispose();
				d2.dispose();
			};

			const d1 = this.successEmitter.event(id, (doneMessage) => {
				dispose();
				// The function passed here describes how to make a remote call for a
				// proxy. Calling callbacks from the server on the client isn't
				// currently needed, so the second function isn't provided.
				const response = parse(doneMessage.getResponse(), (method, args) => {
					// The proxy's ID will be the ID of the message for the call that
					// created the proxy.
					return this.remoteCall(method, args, id);
				});
				if (isProxy(response)) {
					response.onDidDispose(() => this.callbacks.delete(id));
				}
				resolve(response);
			});

			const d2 = this.failEmitter.event(id, (failedMessage) => {
				dispose();
				reject(parse(failedMessage.getResponse()));
			});
		});

		const clientMessage = new ClientMessage();
		clientMessage.setProxy(proxyMessage);
		this.connection.send(clientMessage.serializeBinary());

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
		this.callbacks.get(message.getProxyId())!.get(message.getId())!.callback(
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
			return message.getCallback()!.getId();
		} else if (message.hasSharedProcessActive()) {
			return "shared";
		} else if (message.hasPong()) {
			return "pong";
		}
	}
}
