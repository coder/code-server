import { mkdirp } from "fs-extra";
import * as os from "os";
import { field, logger} from "@coder/logger";
import { ReadWriteConnection } from "../common/connection";
import { Module, ServerProxy } from "../common/proxy";
import { isPromise, isProxy, moduleToProto, parse, platformToProto, protoToModule, stringify } from "../common/util";
import { CallbackMessage, ClientMessage, EventMessage, FailMessage, MethodMessage, NamedCallbackMessage, NamedEventMessage, NumberedCallbackMessage, NumberedEventMessage, Pong, ServerMessage, SuccessMessage, WorkingInitMessage } from "../proto";
import { ChildProcessModuleProxy, ForkProvider, FsModuleProxy, NetModuleProxy, NodePtyModuleProxy, SpdlogModuleProxy, TrashModuleProxy } from "./modules";

// tslint:disable no-any

export interface ServerOptions {
	readonly workingDirectory: string;
	readonly dataDirectory: string;
	readonly cacheDirectory: string;
	readonly builtInExtensionsDirectory: string;
	readonly fork?: ForkProvider;
}

interface ProxyData {
	disposeTimeout?: number | NodeJS.Timer;
	instance: any;
}

export class Server {
	private proxyId = 0;
	private readonly proxies = new Map<number | Module, ProxyData>();
	private disconnected: boolean = false;
	private responseTimeout = 10000;

	public constructor(
		private readonly connection: ReadWriteConnection,
		private readonly options?: ServerOptions,
	) {
		connection.onMessage(async (data) => {
			try {
				await this.handleMessage(ClientMessage.deserializeBinary(data));
			} catch (ex) {
				logger.error(
					"Failed to handle client message",
					field("length", data.byteLength),
					field("exception", {
						message: ex.message,
						stack: ex.stack,
					}),
				);
			}
		});

		connection.onClose(() => {
			this.disconnected = true;

			logger.trace(() => [
				"disconnected from client",
				field("proxies", this.proxies.size),
			]);

			this.proxies.forEach((proxy, proxyId) => {
				if (isProxy(proxy.instance)) {
					proxy.instance.dispose();
				}
				this.removeProxy(proxyId);
			});
		});

		this.storeProxy(new ChildProcessModuleProxy(this.options ? this.options.fork : undefined), Module.ChildProcess);
		this.storeProxy(new FsModuleProxy(), Module.Fs);
		this.storeProxy(new NetModuleProxy(), Module.Net);
		this.storeProxy(new NodePtyModuleProxy(), Module.NodePty);
		this.storeProxy(new SpdlogModuleProxy(), Module.Spdlog);
		this.storeProxy(new TrashModuleProxy(), Module.Trash);

		if (!this.options) {
			logger.warn("No server options provided. InitMessage will not be sent.");

			return;
		}

		Promise.all([
			mkdirp(this.options.cacheDirectory),
			mkdirp(this.options.dataDirectory),
			mkdirp(this.options.workingDirectory),
		]).catch((error) => {
			logger.error(error.message, field("error", error));
		});

		const initMsg = new WorkingInitMessage();
		initMsg.setDataDirectory(this.options.dataDirectory);
		initMsg.setWorkingDirectory(this.options.workingDirectory);
		initMsg.setBuiltinExtensionsDir(this.options.builtInExtensionsDirectory);
		initMsg.setHomeDirectory(os.homedir());
		initMsg.setTmpDirectory(os.tmpdir());
		initMsg.setOperatingSystem(platformToProto(os.platform()));
		initMsg.setShell(os.userInfo().shell || global.process.env.SHELL);
		const srvMsg = new ServerMessage();
		srvMsg.setInit(initMsg);
		connection.send(srvMsg.serializeBinary());
	}

	/**
	 * Handle all messages from the client.
	 */
	private async handleMessage(message: ClientMessage): Promise<void> {
		if (message.hasMethod()) {
			await this.runMethod(message.getMethod()!);
		} else if (message.hasPing()) {
			logger.trace("ping");
			const srvMsg = new ServerMessage();
			srvMsg.setPong(new Pong());
			this.connection.send(srvMsg.serializeBinary());
		} else {
			throw new Error("unknown message type");
		}
	}

	/**
	 * Run a method on a proxy.
	 */
	private async runMethod(message: MethodMessage): Promise<void> {
		const proxyMessage = message.getNamedProxy()! || message.getNumberedProxy()!;
		const id = proxyMessage.getId();
		const proxyId = message.hasNamedProxy()
			? protoToModule(message.getNamedProxy()!.getModule())
			: message.getNumberedProxy()!.getProxyId();
		const method = proxyMessage.getMethod();
		const args = proxyMessage.getArgsList().map((a) => parse(
			a,
			(id, args) => this.sendCallback(proxyId, id, args),
		));

		logger.trace(() => [
			"received",
			field("id", id),
			field("proxyId", proxyId),
			field("method", method),
			field("args", proxyMessage.getArgsList()),
		]);

		let response: any;
		try {
			const proxy = this.getProxy(proxyId);
			if (typeof proxy.instance[method] !== "function") {
				throw new Error(`"${method}" is not a function on proxy ${proxyId}`);
			}

			response = proxy.instance[method](...args);

			// We wait for the client to call "dispose" instead of doing it onDone to
			// ensure all the messages it sent get processed before we get rid of it.
			if (method === "dispose") {
				this.removeProxy(proxyId);
			}

			// Proxies must always return promises.
			if (!isPromise(response)) {
				throw new Error('"${method}" must return a promise');
			}
		} catch (error) {
			logger.error(
				error.message,
				field("type", typeof response),
				field("proxyId", proxyId),
			);
			this.sendException(id, error);
		}

		try {
			this.sendResponse(id, await response);
		} catch (error) {
			this.sendException(id, error);
		}
	}

	/**
	 * Send a callback to the client.
	 */
	private sendCallback(proxyId: number | Module, callbackId: number, args: any[]): void {
		const stringifiedArgs = args.map((a) => this.stringify(a));
		logger.trace(() => [
			"sending callback",
			field("proxyId", proxyId),
			field("callbackId", callbackId),
			field("args", stringifiedArgs),
		]);

		const message = new CallbackMessage();
		let callbackMessage: NamedCallbackMessage | NumberedCallbackMessage;
		if (typeof proxyId === "string") {
			callbackMessage = new NamedCallbackMessage();
			callbackMessage.setModule(moduleToProto(proxyId));
			message.setNamedCallback(callbackMessage);
		} else  {
			callbackMessage = new NumberedCallbackMessage();
			callbackMessage.setProxyId(proxyId);
			message.setNumberedCallback(callbackMessage);
		}
		callbackMessage.setCallbackId(callbackId);
		callbackMessage.setArgsList(stringifiedArgs);

		const serverMessage = new ServerMessage();
		serverMessage.setCallback(message);
		this.connection.send(serverMessage.serializeBinary());
	}

	/**
	 * Store a proxy and bind events to send them back to the client.
	 */
	private storeProxy(instance: ServerProxy): number;
	private storeProxy(instance: any, moduleProxyId: Module): Module;
	private storeProxy(instance: ServerProxy | any, moduleProxyId?: Module): number | Module {
		// In case we disposed while waiting for a function to return.
		if (this.disconnected) {
			if (isProxy(instance)) {
				instance.dispose();
			}

			throw new Error("disposed");
		}

		const proxyId = moduleProxyId || this.proxyId++;
		logger.trace(() => [
			"storing proxy",
			field("proxyId", proxyId),
		]);

		this.proxies.set(proxyId, { instance });

		if (isProxy(instance)) {
			instance.onEvent((event, ...args) => this.sendEvent(proxyId, event, ...args));
			instance.onDone(() => {
				// It might have finished because we disposed it due to a disconnect.
				if (!this.disconnected) {
					this.sendEvent(proxyId, "done");
					this.getProxy(proxyId).disposeTimeout = setTimeout(() => {
						instance.dispose();
						this.removeProxy(proxyId);
					}, this.responseTimeout);
				}
			});
		}

		return proxyId;
	}

	/**
	 * Send an event to the client.
	 */
	private sendEvent(proxyId: number | Module, event: string, ...args: any[]): void {
		const stringifiedArgs = args.map((a) => this.stringify(a));
		logger.trace(() => [
			"sending event",
			field("proxyId", proxyId),
			field("event", event),
			field("args", stringifiedArgs),
		]);

		const message = new EventMessage();
		let eventMessage: NamedEventMessage | NumberedEventMessage;
		if (typeof proxyId === "string") {
			eventMessage = new NamedEventMessage();
			eventMessage.setModule(moduleToProto(proxyId));
			message.setNamedEvent(eventMessage);
		} else  {
			eventMessage = new NumberedEventMessage();
			eventMessage.setProxyId(proxyId);
			message.setNumberedEvent(eventMessage);
		}
		eventMessage.setEvent(event);
		eventMessage.setArgsList(stringifiedArgs);

		const serverMessage = new ServerMessage();
		serverMessage.setEvent(message);
		this.connection.send(serverMessage.serializeBinary());
	}

	/**
	 * Send a response back to the client.
	 */
	private sendResponse(id: number, response: any): void {
		const stringifiedResponse = this.stringify(response);
		logger.trace(() => [
			"sending resolve",
			field("id", id),
			field("response", stringifiedResponse),
		]);

		const successMessage = new SuccessMessage();
		successMessage.setId(id);
		successMessage.setResponse(stringifiedResponse);

		const serverMessage = new ServerMessage();
		serverMessage.setSuccess(successMessage);
		this.connection.send(serverMessage.serializeBinary());
	}

	/**
	 * Send an exception back to the client.
	 */
	private sendException(id: number, error: Error): void {
		const stringifiedError = stringify(error);
		logger.trace(() => [
			"sending reject",
			field("id", id) ,
			field("response", stringifiedError),
		]);

		const failedMessage = new FailMessage();
		failedMessage.setId(id);
		failedMessage.setResponse(stringifiedError);

		const serverMessage = new ServerMessage();
		serverMessage.setFail(failedMessage);
		this.connection.send(serverMessage.serializeBinary());
	}

	/**
	 * Call after disposing a proxy.
	 */
	private removeProxy(proxyId: number | Module): void {
		clearTimeout(this.getProxy(proxyId).disposeTimeout as any);
		this.proxies.delete(proxyId);

		logger.trace(() => [
			"disposed and removed proxy",
			field("proxyId", proxyId),
			field("proxies", this.proxies.size),
		]);
	}

	private stringify(value: any): string {
		return stringify(value, undefined, (p) => this.storeProxy(p));
	}

	private getProxy(proxyId: number | Module): ProxyData {
		if (!this.proxies.has(proxyId)) {
			throw new Error(`proxy ${proxyId} disposed too early`);
		}

		return this.proxies.get(proxyId)!;
	}
}
