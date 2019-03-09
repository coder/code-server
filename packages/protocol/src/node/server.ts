import { ForkOptions, ChildProcess } from "child_process";
import { mkdirp } from "fs-extra";
import * as os from "os";
import { logger, field } from "@coder/logger";
import { Pong, ServerMessage, ClientMessage, WorkingInitMessage, MethodMessage, SuccessMessage, FailMessage, CallbackMessage } from "../proto";
import { ReadWriteConnection } from "../common/connection";
import { DisposableProxy } from "../common/proxy";
import { stringify, parse, isPromise, isProxy } from "../common/util";
import { Fs } from "./modules";

// `any` is needed to deal with sending and receiving arguments of any type.
// tslint:disable no-any

export type ForkProvider = (modulePath: string, args: string[], options: ForkOptions) => ChildProcess;

export interface ServerOptions {
	readonly workingDirectory: string;
	readonly dataDirectory: string;
	readonly cacheDirectory: string;
	readonly builtInExtensionsDirectory: string;
	readonly fork?: ForkProvider;
}

export class Server {
	private readonly proxies = new Map<number, DisposableProxy>();
	private readonly modules = {
		fs: new Fs(),
	};

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
			this.proxies.forEach((p) => p.dispose());
		});

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
		const platform = os.platform();
		let operatingSystem: WorkingInitMessage.OperatingSystem;
		switch (platform) {
			case "win32":
				operatingSystem = WorkingInitMessage.OperatingSystem.WINDOWS;
				break;
			case "linux":
				operatingSystem = WorkingInitMessage.OperatingSystem.LINUX;
				break;
			case "darwin":
				operatingSystem = WorkingInitMessage.OperatingSystem.MAC;
				break;
			default:
				throw new Error(`unrecognized platform "${platform}"`);
		}
		initMsg.setOperatingSystem(operatingSystem);
		initMsg.setShell(os.userInfo().shell || global.process.env.SHELL);
		const srvMsg = new ServerMessage();
		srvMsg.setInit(initMsg);
		connection.send(srvMsg.serializeBinary());
	}

	/**
	 * Handle all messages from the client.
	 */
	private async handleMessage(message: ClientMessage): Promise<void> {
		if (message.hasProxy()) {
			const proxyMessage = message.getProxy()!;
			logger.trace(() => [
				"received",
				field("id", proxyMessage.getId()),
				field("module", proxyMessage.getModule()),
				field("method", proxyMessage.getMethod()),
				field("args", proxyMessage.getArgsList()),
			]);
			await this.runProxy(proxyMessage);
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
	private async runProxy(message: MethodMessage): Promise<void> {
		// The method will either be for a module proxy or a proxy returned by one
		// of the module's methods.
		const moduleNameOrProxyId = message.getModule() || message.getProxyId();
		const proxy = typeof moduleNameOrProxyId === "string"
			? this.modules[moduleNameOrProxyId as "fs"]
			: this.proxies.get(moduleNameOrProxyId);

		try {
			const method = message.getMethod();
			if (typeof (proxy as any)[method] !== "function") {
				throw new Error(`"${method}" is not a function`);
			}

			const result = (proxy as any)[method](
				// The function passed here describes how to make a remote call for a
				// callback. Calling proxies from the client on the server isn't currently
				// needed, so the first function isn't provided.
				...message.getArgsList().map((a) => parse(a, undefined, (id, args) => {
					const callbackMessage = new CallbackMessage();
					callbackMessage.setId(id);
					callbackMessage.setArgsList(args.map((a) => stringify(a)));

					const serverMessage = new ServerMessage();
					serverMessage.setCallback(callbackMessage);
					this.connection.send(serverMessage.serializeBinary());
				})),
			);

			// Proxies must always return promises since synchronous values won't work
			// due to the async nature of these messages. This is mostly just to catch
			// errors during development.
			if (!isPromise(result)) {
				throw new Error("invalid response from proxy");
			}

			const response = await result;
			if (isProxy(response)) {
				this.proxies.set(message.getId(), response);
				response.onDidDispose(() => this.proxies.delete(message.getId()));
			}
			this.sendResponse(message.getId(), response);
		} catch (error) {
			this.sendException(message.getId(), error);
		}
	}

	/**
	 * Send a response back to the client.
	 */
	private sendResponse(id: number, response: any): void {
		logger.trace(() => [
			"sending resolve",
			field("id", id),
			field("response", stringify(response)),
		]);

		const successMessage = new SuccessMessage();
		successMessage.setId(id);
		// Sending functions from the server to the client is not needed, so the
		// the second argument isn't provided.
		successMessage.setResponse(stringify(response));

		const serverMessage = new ServerMessage();
		serverMessage.setSuccess(successMessage);
		this.connection.send(serverMessage.serializeBinary());
	}

	/**
	 * Send an exception back to the client.
	 */
	private sendException(id: number, error: Error): void {
		logger.trace(() => [
			"sending reject",
			field("id", id) ,
			field("response", stringify(error)),
		]);

		const failedMessage = new FailMessage();
		failedMessage.setId(id);
		failedMessage.setResponse(stringify(error));

		const serverMessage = new ServerMessage();
		serverMessage.setFail(failedMessage);
		this.connection.send(serverMessage.serializeBinary());
	}
}
