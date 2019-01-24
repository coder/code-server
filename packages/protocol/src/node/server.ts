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
		const srvMsg = new ServerMessage();
		srvMsg.setInit(initMsg);
		connection.send(srvMsg.serializeBinary());
	}

	private handleMessage(message: ClientMessage): void {
		if (message.hasNewEval()) {
			evaluate(this.connection, message.getNewEval()!);
		} else if (message.hasNewSession()) {
			const session = handleNewSession(this.connection, message.getNewSession()!, this.options, () => {
				this.sessions.delete(message.getNewSession()!.getId());
			});
			this.sessions.set(message.getNewSession()!.getId(), session);
		} else if (message.hasCloseSessionInput()) {
			const s = this.getSession(message.getCloseSessionInput()!.getId());
			if (!s || !s.stdin) {
				return;
			}
			s.stdin.end();
		} else if (message.hasResizeSessionTty()) {
			const s = this.getSession(message.getResizeSessionTty()!.getId());
			if (!s || !s.resize) {
				return;
			}
			const tty = message.getResizeSessionTty()!.getTtyDimensions()!;
			s.resize(tty.getWidth(), tty.getHeight());
		} else if (message.hasShutdownSession()) {
			const s = this.getSession(message.getShutdownSession()!.getId());
			if (!s) {
				return;
			}
			s.kill(message.getShutdownSession()!.getSignal());
		} else if (message.hasWriteToSession()) {
			const s = this.getSession(message.getWriteToSession()!.getId());
			if (!s) {
				return;
			}
			const data = new TextDecoder().decode(message.getWriteToSession()!.getData_asU8());
			const source = message.getWriteToSession()!.getSource();
			if (source === WriteToSessionMessage.Source.IPC) {
				if (!s.stdio || !s.stdio[3]) {
					throw new Error("Cannot send message via IPC to process without IPC");
				}
				(s.stdio[3] as WriteStream).write(data);
			} else {
				s.write(data);
			}
		} else if (message.hasNewConnection()) {
			const socket = handleNewConnection(this.connection, message.getNewConnection()!, () => {
				this.connections.delete(message.getNewConnection()!.getId());
			});
			this.connections.set(message.getNewConnection()!.getId(), socket);
		} else if (message.hasConnectionOutput()) {
			const c = this.getConnection(message.getConnectionOutput()!.getId());
			if (!c) {
				return;
			}
			c.write(Buffer.from(message.getConnectionOutput()!.getData_asU8()));
		} else if (message.hasConnectionClose()) {
			const c = this.getConnection(message.getConnectionClose()!.getId());
			if (!c) {
				return;
			}
			c.end();
		} else if (message.hasNewServer()) {
			const s = handleNewServer(this.connection, message.getNewServer()!, (socket) => {
				const id = this.connectionId--;
				this.connections.set(id, socket);
				return id;
			}, () => {
				this.connections.delete(message.getNewServer()!.getId());
			});
			this.servers.set(message.getNewServer()!.getId(), s);
		} else if (message.hasServerClose()) {
			const s = this.getServer(message.getServerClose()!.getId());
			if (!s) {
				return;
			}
			s.close();
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
