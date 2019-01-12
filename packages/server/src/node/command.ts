import * as cp from "child_process";
import * as nodePty from "node-pty";
import * as stream from "stream";
import { TextEncoder } from "text-encoding";
import { NewSessionMessage, ServerMessage, SessionDoneMessage, SessionOutputMessage, ShutdownSessionMessage, IdentifySessionMessage, ClientMessage } from "../proto";
import { SendableConnection } from "../common/connection";

export interface Process {
	stdin?: stream.Writable;
	stdout?: stream.Readable;
	stderr?: stream.Readable;

	pid: number;
	killed?: boolean;

	on(event: "data", cb: (data: string) => void): void;
	on(event: 'exit', listener: (exitCode: number, signal?: number) => void): void;
	write(data: string | Uint8Array): void;
	resize?(cols: number, rows: number): void;
	kill(signal?: string): void;
	title?: number;
}

export const handleNewSession = (connection: SendableConnection, newSession: NewSessionMessage, onExit: () => void): Process => {
	let process: Process;

	const env = {} as any;
	newSession.getEnvMap().forEach((value: any, key: any) => {
		env[key] = value;
	});
	if (newSession.getTtyDimensions()) {
		// Spawn with node-pty
		process = nodePty.spawn(newSession.getCommand(), newSession.getArgsList(), {
			cols: newSession.getTtyDimensions()!.getWidth(),
			rows: newSession.getTtyDimensions()!.getHeight(),
			cwd: newSession.getCwd(),
			env,
		});
	} else {
		const options = {
			cwd: newSession.getCwd(),
			env,
		};
		let proc: cp.ChildProcess;
		if (newSession.getIsFork()) {
			proc = cp.fork(newSession.getCommand(), newSession.getArgsList());
		} else {
			proc = cp.spawn(newSession.getCommand(), newSession.getArgsList(), options);
		}

		process = {
			stdin: proc.stdin,
			stderr: proc.stderr,
			stdout: proc.stdout,
			on: (...args: any[]) => (<any>proc.on)(...args),
			write: (d) => proc.stdin.write(d),
			kill: (s) => proc.kill(s || "SIGTERM"),
			pid: proc.pid,
		};
	}

	const sendOutput = (fd: SessionOutputMessage.FD, msg: string | Uint8Array): void => {
		const serverMsg = new ServerMessage();
		const d = new SessionOutputMessage();
		d.setId(newSession.getId());
		d.setData(typeof msg === "string" ? new TextEncoder().encode(msg) : msg);
		d.setFd(SessionOutputMessage.FD.STDOUT);
		serverMsg.setSessionOutput(d);
		connection.send(serverMsg.serializeBinary());
	};

	if (process.stdout && process.stderr) {
		process.stdout.on("data", (data) => {
			sendOutput(SessionOutputMessage.FD.STDOUT, data);
		});

		process.stderr.on("data", (data) => {
			sendOutput(SessionOutputMessage.FD.STDERR, data);
		});
	} else {
		process.on("data", (data) => {
			sendOutput(SessionOutputMessage.FD.STDOUT, Buffer.from(data));
		});
	}

	const id = new IdentifySessionMessage();
	id.setId(newSession.getId());
	id.setPid(process.pid);
	const sm = new ServerMessage();
	sm.setIdentifySession(id);
	connection.send(sm.serializeBinary());

	process.on("exit", (code, signal) => {
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
