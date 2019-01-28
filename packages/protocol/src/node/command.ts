import * as cp from "child_process";
import * as net from "net";
import * as nodePty from "node-pty";
import * as stream from "stream";
import { TextEncoder } from "text-encoding";
import { Logger, logger, field } from "@coder/logger";
import { NewSessionMessage, ServerMessage, SessionDoneMessage, SessionOutputMessage, IdentifySessionMessage, NewConnectionMessage, ConnectionEstablishedMessage, NewConnectionFailureMessage, ConnectionCloseMessage, ConnectionOutputMessage, NewServerMessage, ServerEstablishedMessage, NewServerFailureMessage, ServerCloseMessage, ServerConnectionEstablishedMessage } from "../proto";
import { SendableConnection } from "../common/connection";
import { ServerOptions } from "./server";

export interface Process {
	stdio?: Array<stream.Readable | stream.Writable>;
	stdin?: stream.Writable;
	stdout?: stream.Readable;
	stderr?: stream.Readable;

	pid: number;
	killed?: boolean;

	on(event: "data", cb: (data: string) => void): void;
	on(event: "exit", listener: (exitCode: number, signal?: number) => void): void;
	write(data: string | Uint8Array): void;
	resize?(cols: number, rows: number): void;
	kill(signal?: string): void;
	title?: number;
}

export const handleNewSession = (connection: SendableConnection, newSession: NewSessionMessage, serverOptions: ServerOptions | undefined, onExit: () => void): Process => {
	const childLogger = getChildLogger(newSession.getCommand());
	childLogger.debug(() => [
		newSession.getIsFork() ? "Forking" : "Spawning",
		field("command", newSession.getCommand()),
		field("args", newSession.getArgsList()),
		field("env", newSession.getEnvMap().toObject()),
	]);

	let process: Process;
	let processTitle: string | undefined;

	const env: { [key: string]: string } = {};
	newSession.getEnvMap().forEach((value, key) => {
		env[key] = value;
	});
	if (newSession.getTtyDimensions()) {
		// Spawn with node-pty
		const ptyProc = nodePty.spawn(newSession.getCommand(), newSession.getArgsList(), {
			cols: newSession.getTtyDimensions()!.getWidth(),
			rows: newSession.getTtyDimensions()!.getHeight(),
			cwd: newSession.getCwd(),
			env,
		});

		const timer = setInterval(() => {
			if (ptyProc.process !== processTitle) {
				processTitle = ptyProc.process;
				const id = new IdentifySessionMessage();
				id.setId(newSession.getId());
				id.setTitle(processTitle);
				const sm = new ServerMessage();
				sm.setIdentifySession(id);
				connection.send(sm.serializeBinary());
			}
		}, 200);
		
		ptyProc.on("exit", () => {
			clearTimeout(timer);
		});

		process = ptyProc;
		processTitle = ptyProc.process;
	} else {
		const options = {
			cwd: newSession.getCwd(),
			env,
		};
		let proc: cp.ChildProcess;
		if (newSession.getIsFork()) {
			if (!serverOptions) {
				throw new Error("No forkProvider set for bootstrap-fork request");
			}

			if (!serverOptions.forkProvider) {
				throw new Error("No forkProvider set for server options");
			}

			proc = serverOptions.forkProvider(newSession);
		} else {
			proc = cp.spawn(newSession.getCommand(), newSession.getArgsList(), options);
		}

		process = {
			stdin: proc.stdin,
			stderr: proc.stderr,
			stdout: proc.stdout,
			stdio: proc.stdio,
			on: (...args: any[]): void => ((proc as any).on)(...args), // tslint:disable-line no-any
			write: (d): boolean => proc.stdin.write(d),
			kill: (s): void => proc.kill(s || "SIGTERM"),
			pid: proc.pid,
		};
	}

	const sendOutput = (_source: SessionOutputMessage.Source, msg: string | Uint8Array): void => {
		childLogger.debug(() => {

			let data = msg.toString();
			if (_source === SessionOutputMessage.Source.IPC) {
				data = Buffer.from(msg.toString(), "base64").toString();
			}

			return [
				_source === SessionOutputMessage.Source.STDOUT
					? "stdout"
					: (_source === SessionOutputMessage.Source.STDERR ? "stderr" : "ipc"),
				field("id", newSession.getId()),
				field("data", data),
			];
		});
		const serverMsg = new ServerMessage();
		const d = new SessionOutputMessage();
		d.setId(newSession.getId());
		d.setData(typeof msg === "string" ? new TextEncoder().encode(msg) : msg);
		d.setSource(_source);
		serverMsg.setSessionOutput(d);
		connection.send(serverMsg.serializeBinary());
	};

	if (process.stdout && process.stderr) {
		process.stdout.on("data", (data) => {
			sendOutput(SessionOutputMessage.Source.STDOUT, data);
		});

		process.stderr.on("data", (data) => {
			sendOutput(SessionOutputMessage.Source.STDERR, data);
		});
	} else {
		process.on("data", (data) => {
			sendOutput(SessionOutputMessage.Source.STDOUT, Buffer.from(data));
		});
	}

	if (process.stdio && process.stdio[3]) {
		// We have ipc fd
		process.stdio[3].on("data", (data) => {
			sendOutput(SessionOutputMessage.Source.IPC, data);
		});
	}

	const id = new IdentifySessionMessage();
	id.setId(newSession.getId());
	id.setPid(process.pid);
	if (processTitle) {
		id.setTitle(processTitle);
	}
	const sm = new ServerMessage();
	sm.setIdentifySession(id);
	connection.send(sm.serializeBinary());

	process.on("exit", (code) => {
		childLogger.debug("Exited", field("id", newSession.getId()));
		const serverMsg = new ServerMessage();
		const exit = new SessionDoneMessage();
		exit.setId(newSession.getId());
		exit.setExitStatus(code);
		serverMsg.setSessionDone(exit);
		connection.send(serverMsg.serializeBinary());

		onExit();
	});

	return process;
};

export const handleNewConnection = (connection: SendableConnection, newConnection: NewConnectionMessage, onExit: () => void): net.Socket => {
	const target = newConnection.getPath() || `${newConnection.getPort()}`;
	const childLogger = getChildLogger(target, ">");

	const id = newConnection.getId();
	let socket: net.Socket;
	let didConnect = false;
	const connectCallback = (): void => {
		childLogger.debug("Connected", field("id", newConnection.getId()), field("target", target));
		didConnect = true;
		const estab = new ConnectionEstablishedMessage();
		estab.setId(id);
		const servMsg = new ServerMessage();
		servMsg.setConnectionEstablished(estab);
		connection.send(servMsg.serializeBinary());
	};

	if (newConnection.getPath()) {
		socket = net.createConnection(newConnection.getPath(), connectCallback);
	} else if (newConnection.getPort()) {
		socket = net.createConnection(newConnection.getPort(), undefined, connectCallback);
	} else {
		throw new Error("No path or port provided for new connection");
	}

	socket.addListener("error", (err) => {
		childLogger.debug("Error", field("id", newConnection.getId()), field("error", err));
		if (!didConnect) {
			const errMsg = new NewConnectionFailureMessage();
			errMsg.setId(id);
			errMsg.setMessage(err.message);
			const servMsg = new ServerMessage();
			servMsg.setConnectionFailure(errMsg);
			connection.send(servMsg.serializeBinary());

			onExit();
		}
	});

	socket.addListener("close", () => {
		childLogger.debug("Closed", field("id", newConnection.getId()));
		if (didConnect) {
			const closed = new ConnectionCloseMessage();
			closed.setId(id);
			const servMsg = new ServerMessage();
			servMsg.setConnectionClose(closed);
			connection.send(servMsg.serializeBinary());

			onExit();
		}
	});

	socket.addListener("data", (data) => {
		childLogger.debug(() => [
			"ipc",
			field("id", newConnection.getId()),
			field("data", data),
		]);
		const dataMsg = new ConnectionOutputMessage();
		dataMsg.setId(id);
		dataMsg.setData(data);
		const servMsg = new ServerMessage();
		servMsg.setConnectionOutput(dataMsg);
		connection.send(servMsg.serializeBinary());
	});

	return socket;
};

export const handleNewServer = (connection: SendableConnection, newServer: NewServerMessage, addSocket: (socket: net.Socket) => number, onExit: () => void, onSocketExit: (id: number) => void): net.Server => {
	const target = newServer.getPath() || `${newServer.getPort()}`;
	const childLogger = getChildLogger(target, "|");

	const s = net.createServer();

	try {
		s.listen(newServer.getPath() ? newServer.getPath() : newServer.getPort(), () => {
			childLogger.debug("Listening", field("id", newServer.getId()), field("target", target));
			const se = new ServerEstablishedMessage();
			se.setId(newServer.getId());
			const sm = new ServerMessage();
			sm.setServerEstablished(se);
			connection.send(sm.serializeBinary());
		});
	} catch (ex) {
		childLogger.debug("Failed to listen", field("id", newServer.getId()), field("target", target));
		const sf = new NewServerFailureMessage();
		sf.setId(newServer.getId());
		const sm = new ServerMessage();
		sm.setServerFailure(sf);
		connection.send(sm.serializeBinary());

		onExit();
	}

	s.on("close", () => {
		childLogger.debug("Stopped listening", field("id", newServer.getId()), field("target", target));
		const sc = new ServerCloseMessage();
		sc.setId(newServer.getId());
		const sm = new ServerMessage();
		sm.setServerClose(sc);
		connection.send(sm.serializeBinary());

		onExit();
	});

	s.on("connection", (socket) => {
		const socketId = addSocket(socket);
		childLogger.debug("Got connection", field("id", newServer.getId()), field("socketId", socketId));

		const sock = new ServerConnectionEstablishedMessage();
		sock.setServerId(newServer.getId());
		sock.setConnectionId(socketId);
		const sm = new ServerMessage();
		sm.setServerConnectionEstablished(sock);
		connection.send(sm.serializeBinary());

		socket.addListener("data", (data) => {
			childLogger.debug(() => [
				"ipc",
				field("id", newServer.getId()),
				field("socketId", socketId),
				field("data", data),
			]);
			const dataMsg = new ConnectionOutputMessage();
			dataMsg.setId(socketId);
			dataMsg.setData(data);
			const servMsg = new ServerMessage();
			servMsg.setConnectionOutput(dataMsg);
			connection.send(servMsg.serializeBinary());
		});

		socket.on("error", (error) => {
			childLogger.debug("Error", field("id", newServer.getId()), field("socketId", socketId), field("error", error));
			onSocketExit(socketId);
		});

		socket.on("close", () => {
			childLogger.debug("Closed", field("id", newServer.getId()), field("socketId", socketId));
			onSocketExit(socketId);
		});
	});

	return s;
};

const getChildLogger = (command: string, prefix: string = ""): Logger => {
	// TODO: Temporary, for debugging. Should probably ask for a name?
	let name: string;
	if (command.includes("vscode-ipc") || command.includes("extensionHost")) {
		name = "exthost";
	} else if (command.includes("vscode-online")) {
		name = "shared";
	} else {
		const basename = command.split("/").pop()!;
		let i = 0;
		for (; i < basename.length; i++) {
			const character = basename.charAt(i);
			if (isNaN(+character) && character === character.toUpperCase()) {
				break;
			}
		}
		name = basename.substring(0, i);
	}

	return logger.named(prefix + name);
};
