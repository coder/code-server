import * as os from "os";
import * as cp from "child_process";
import * as path from "path";
import { mkdir, WriteStream } from "fs";
import { promisify } from "util";
import { TextDecoder } from "text-encoding";
import { logger, field } from "@coder/logger";
import { ClientMessage, WorkingInitMessage, ServerMessage, NewSessionMessage, WriteToSessionMessage } from "../proto";
import { evaluate } from "./evaluate";
import { ReadWriteConnection } from "../common/connection";
import { Process, handleNewSession, handleNewConnection, handleNewServer } from "./command";
import * as net from "net";

export interface ServerOptions {
	readonly workingDirectory: string;
	readonly dataDirectory: string;

	forkProvider?(message: NewSessionMessage): cp.ChildProcess;
}

export class Server {

	private readonly sessions: Map<number, Process> = new Map();
	private readonly connections: Map<number, net.Socket> = new Map();
	private readonly servers: Map<number, net.Server> = new Map();

	private connectionId: number = Number.MAX_SAFE_INTEGER;

	public constructor(
		private readonly connection: ReadWriteConnection,
		private readonly options?: ServerOptions,
	) {
		connection.onMessage((data) => {
			try {
				this.handleMessage(ClientMessage.deserializeBinary(data));
			} catch (ex) {
				logger.error("Failed to handle client message", field("length", data.byteLength), field("exception", ex));
			}
		});

		if (!options) {
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
					if (error.code !== "EEXIST") {
						throw error;
					}
				}
			}
		};
		Promise.all([ mkdirP(path.join(options.dataDirectory, "User", "workspaceStorage")) ]).then(() => {
			logger.info("Created data directory");
		}).catch((error) => {
			logger.error(error.message, field("error", error));
		});

		const initMsg = new WorkingInitMessage();
		initMsg.setDataDirectory(options.dataDirectory);
		initMsg.setWorkingDirectory(options.workingDirectory);
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
		if (process.env.SHELL) {
			initMsg.setShell(process.env.SHELL);
		}
		const srvMsg = new ServerMessage();
		srvMsg.setInit(initMsg);
		connection.send(srvMsg.serializeBinary());
	}

	private handleMessage(message: ClientMessage): void {
		if (message.hasNewEval()) {
			const evalMessage = message.getNewEval()!;
			logger.debug("EvalMessage", field("id", evalMessage.getId()));
			evaluate(this.connection, evalMessage);
		} else if (message.hasNewSession()) {
			const sessionMessage = message.getNewSession()!;
			logger.debug("NewSession", field("id", sessionMessage.getId()));
			const session = handleNewSession(this.connection, sessionMessage, this.options, () => {
				this.sessions.delete(sessionMessage.getId());
			});
			this.sessions.set(sessionMessage.getId(), session);
		} else if (message.hasCloseSessionInput()) {
			const closeSessionMessage = message.getCloseSessionInput()!;
			logger.debug("CloseSessionInput", field("id", closeSessionMessage.getId()));
			const s = this.getSession(closeSessionMessage.getId());
			if (!s || !s.stdin) {
				return;
			}
			s.stdin.end();
		} else if (message.hasResizeSessionTty()) {
			const resizeSessionTtyMessage = message.getResizeSessionTty()!;
			logger.debug("ResizeSessionTty", field("id", resizeSessionTtyMessage.getId()));
			const s = this.getSession(resizeSessionTtyMessage.getId());
			if (!s || !s.resize) {
				return;
			}
			const tty = resizeSessionTtyMessage.getTtyDimensions()!;
			s.resize(tty.getWidth(), tty.getHeight());
		} else if (message.hasShutdownSession()) {
			const shutdownSessionMessage = message.getShutdownSession()!;
			logger.debug("ShutdownSession", field("id", shutdownSessionMessage.getId()));
			const s = this.getSession(shutdownSessionMessage.getId());
			if (!s) {
				return;
			}
			s.kill(shutdownSessionMessage.getSignal());
		} else if (message.hasWriteToSession()) {
			const writeToSessionMessage = message.getWriteToSession()!;
			logger.debug("WriteToSession", field("id", writeToSessionMessage.getId()));
			const s = this.getSession(writeToSessionMessage.getId());
			if (!s) {
				return;
			}
			const data = new TextDecoder().decode(writeToSessionMessage.getData_asU8());
			const source = writeToSessionMessage.getSource();
			if (source === WriteToSessionMessage.Source.IPC) {
				if (!s.stdio || !s.stdio[3]) {
					throw new Error("Cannot send message via IPC to process without IPC");
				}
				(s.stdio[3] as WriteStream).write(data);
			} else {
				s.write(data);
			}
		} else if (message.hasNewConnection()) {
			const connectionMessage = message.getNewConnection()!;
			logger.debug("NewConnection", field("id", connectionMessage.getId()));
			if (this.connections.has(connectionMessage.getId())) {
				throw new Error(`connect EISCONN ${connectionMessage.getPath() || connectionMessage.getPort()}`);
			}
			const socket = handleNewConnection(this.connection, connectionMessage, () => {
				this.connections.delete(connectionMessage.getId());
			});
			this.connections.set(connectionMessage.getId(), socket);
		} else if (message.hasConnectionOutput()) {
			const connectionOutputMessage = message.getConnectionOutput()!;
			logger.debug("ConnectionOuput", field("id", connectionOutputMessage.getId()));
			const c = this.getConnection(connectionOutputMessage.getId());
			if (!c) {
				return;
			}
			c.write(Buffer.from(connectionOutputMessage.getData_asU8()));
		} else if (message.hasConnectionClose()) {
			const connectionCloseMessage = message.getConnectionClose()!;
			logger.debug("ConnectionClose", field("id", connectionCloseMessage.getId()));
			const c = this.getConnection(connectionCloseMessage.getId());
			if (!c) {
				return;
			}
			c.end();
		} else if (message.hasNewServer()) {
			const serverMessage = message.getNewServer()!;
			logger.debug("NewServer", field("id", serverMessage.getId()));
			if (this.servers.has(serverMessage.getId())) {
				throw new Error("multiple listeners not supported");
			}
			const s = handleNewServer(this.connection, serverMessage, (socket) => {
				const id = this.connectionId--;
				this.connections.set(id, socket);

				return id;
			}, () => {
				this.connections.delete(serverMessage.getId());
			}, (id) => {
				this.connections.delete(id);
			});
			this.servers.set(serverMessage.getId(), s);
		} else if (message.hasServerClose()) {
			const serverCloseMessage = message.getServerClose()!;
			logger.debug("ServerClose", field("id", serverCloseMessage.getId()));
			const s = this.getServer(serverCloseMessage.getId());
			if (!s) {
				return;
			}
			s.close();
		} else {
			logger.debug("Received unknown message type");
		}
	}

	private getServer(id: number): net.Server | undefined {
		return this.servers.get(id);
	}

	private getConnection(id: number): net.Socket | undefined {
		return this.connections.get(id);
	}

	private getSession(id: number): Process | undefined {
		return this.sessions.get(id);
	}

}
