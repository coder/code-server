import * as os from "os";
import * as path from "path";
import { mkdir } from "fs";
import { promisify } from "util";
import { logger, field } from "@coder/logger";
import { Pong, ClientMessage, WorkingInitMessage, ServerMessage } from "../proto";
import { evaluate, ActiveEvaluation } from "./evaluate";
import { ForkProvider } from "../common/helpers";
import { ReadWriteConnection } from "../common/connection";

export interface ServerOptions {
	readonly workingDirectory: string;
	readonly dataDirectory: string;
	readonly builtInExtensionsDirectory: string;
	readonly fork?: ForkProvider;
}

export class Server {
	private readonly evals = new Map<number, ActiveEvaluation>();

	public constructor(
		private readonly connection: ReadWriteConnection,
		private readonly options?: ServerOptions,
	) {
		connection.onMessage((data) => {
			try {
				this.handleMessage(ClientMessage.deserializeBinary(data));
			} catch (ex) {
				logger.error("Failed to handle client message", field("length", data.byteLength), field("exception", {
					message: ex.message,
					stack: ex.stack,
				}));
			}
		});
		connection.onClose(() => {
			this.evals.forEach((e) => e.dispose());
		});

		if (!this.options) {
			logger.warn("No server options provided. InitMessage will not be sent.");

			return;
		}

		// Ensure the data directory exists.
		const mkdirP = async (path: string): Promise<void> => {
			const split = path.replace(/^\/*|\/*$/g, "").split("/");
			let dir = "";
			while (split.length > 0) {
				dir += "/" + split.shift();
				try {
					await promisify(mkdir)(dir);
				} catch (error) {
					if (error.code !== "EEXIST" && error.code !== "EISDIR") {
						throw error;
					}
				}
			}
		};
		Promise.all([ mkdirP(path.join(this.options.dataDirectory, "User", "workspaceStorage")) ]).then(() => {
			logger.info("Created data directory");
		}).catch((error) => {
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

	private handleMessage(message: ClientMessage): void {
		if (message.hasNewEval()) {
			const evalMessage = message.getNewEval()!;
			logger.trace(() => [
				"EvalMessage",
				field("id", evalMessage.getId()),
				field("args", evalMessage.getArgsList()),
				field("function", evalMessage.getFunction()),
			]);
			const resp = evaluate(this.connection, evalMessage, () => {
				this.evals.delete(evalMessage.getId());
				logger.trace(() => [
					`dispose ${evalMessage.getId()}, ${this.evals.size} left`,
				]);
			}, this.options ? this.options.fork : undefined);
			if (resp) {
				this.evals.set(evalMessage.getId(), resp);
			}
		} else if (message.hasEvalEvent()) {
			const evalEventMessage = message.getEvalEvent()!;
			const e = this.evals.get(evalEventMessage.getId());
			if (!e) {
				return;
			}
			e.onEvent(evalEventMessage);
		} else if (message.hasPing()) {
			logger.trace("ping");
			const srvMsg = new ServerMessage();
			srvMsg.setPong(new Pong());
			this.connection.send(srvMsg.serializeBinary());
		} else {
			throw new Error("unknown message type");
		}
	}
}
