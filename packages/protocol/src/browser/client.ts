import { ReadWriteConnection } from "../common/connection";
import { NewEvalMessage, ServerMessage, EvalDoneMessage, EvalFailedMessage, TypedValue, ClientMessage, NewSessionMessage, TTYDimensions, SessionOutputMessage, CloseSessionInputMessage } from "../proto";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ChildProcess, SpawnOptions, ServerProcess } from "./command";

/**
 * Client accepts an arbitrary connection intended to communicate with the Server.
 */
export class Client {
	private evalId: number = 0;
	private evalDoneEmitter: Emitter<EvalDoneMessage> = new Emitter();
	private evalFailedEmitter: Emitter<EvalFailedMessage> = new Emitter();

	private sessionId: number = 0;
	private sessions: Map<number, ServerProcess> = new Map();

	/**
	 * @param connection Established connection to the server
	 */
	public constructor(
		private readonly connection: ReadWriteConnection,
	) {
		connection.onMessage((data) => {
			try {
				this.handleMessage(ServerMessage.deserializeBinary(data));
			} catch (ex) {
				logger.error("Failed to handle server message", field("length", data.byteLength), field("exception", ex));
			}
		});
	}

	public evaluate<R>(func: () => R | Promise<R>): Promise<R>;
	public evaluate<R, T1>(func: (a1: T1) => R | Promise<R>, a1: T1): Promise<R>;
	public evaluate<R, T1, T2>(func: (a1: T1, a2: T2) => R | Promise<R>, a1: T1, a2: T2): Promise<R>;
	public evaluate<R, T1, T2, T3>(func: (a1: T1, a2: T2, a3: T3) => R | Promise<R>, a1: T1, a2: T2, a3: T3): Promise<R>;
	public evaluate<R, T1, T2, T3, T4>(func: (a1: T1, a2: T2, a3: T3, a4: T4) => R | Promise<R>, a1: T1, a2: T2, a3: T3, a4: T4): Promise<R>;
	public evaluate<R, T1, T2, T3, T4, T5>(func: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R | Promise<R>, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): Promise<R>;
	public evaluate<R, T1, T2, T3, T4, T5, T6>(func: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R | Promise<R>, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): Promise<R>;
	/**
	 * Evaluates a function on the server.
	 * To pass variables, ensure they are serializable and passed through the included function.
	 * @example
	 * const returned = await this.client.evaluate((value) => {
	 *     return value;
	 * }, "hi");
	 * console.log(returned);
	 * // output: "hi"
	 * @param func Function to evaluate
	 * @returns {Promise} Promise rejected or resolved from the evaluated function
	 */
		public evaluate<R, T1, T2, T3, T4, T5, T6>(func: (a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6) => R | Promise<R>, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6): Promise<R> {
		const newEval = new NewEvalMessage();
		const id = this.evalId++;
		newEval.setId(id);
		newEval.setArgsList([a1, a2, a3, a4, a5, a6].filter(a => a).map(a => JSON.stringify(a)));
		newEval.setFunction(func.toString());

		const clientMsg = new ClientMessage();
		clientMsg.setNewEval(newEval);
		this.connection.send(clientMsg.serializeBinary());

		let res: (value?: R) => void;
		let rej: (err?: any) => void;
		const prom = new Promise<R>((r, e) => {
			res = r;
			rej = e;
		});

		const d1 = this.evalDoneEmitter.event((doneMsg) => {
			if (doneMsg.getId() === id) {
				d1.dispose();
				d2.dispose();

				const resp = doneMsg.getResponse();
				if (!resp) {
					res();

					return;
				}

				const rt = resp.getType();
				let val: any;
				switch (rt) {
					case TypedValue.Type.BOOLEAN:
						val = resp.getValue() === "true";
						break;
					case TypedValue.Type.NUMBER:
						val = parseInt(resp.getValue(), 10);
						break;
					case TypedValue.Type.OBJECT:
						val = JSON.parse(resp.getValue());
						break;
					case TypedValue.Type.STRING:
						val = resp.getValue();
						break;
					default:
						throw new Error(`unsupported typed value ${rt}`);
				}

				res(val);
			}
		});

		const d2 = this.evalFailedEmitter.event((failedMsg) => {
			if (failedMsg.getId() === id) {
				d1.dispose();
				d2.dispose();

				rej(failedMsg.getMessage());
			}
		});

		return prom;
	}

	/**
	 * Spawns a process from a command. _Somewhat_ reflects the "child_process" API.
	 * @example
	 * const cp = this.client.spawn("echo", ["test"]);
	 * cp.stdout.on("data", (data) => console.log(data.toString()));
	 * cp.on("exit", (code) => console.log("exited with", code));
	 * @param command
	 * @param args Arguments
	 * @param options Options to execute for the command
	 */
	public spawn(command: string, args: string[] = [], options?: SpawnOptions): ChildProcess {
		return this.doSpawn(command, args, options, false);
	}

	/**
	 * Fork a module.
	 * @param modulePath Path of the module
	 * @param args Args to add for the module
	 * @param options Options to execute
	 */
	public fork(modulePath: string, args: string[] = [], options?: SpawnOptions): ChildProcess {
		return this.doSpawn(modulePath, args, options, true);
	}

	private doSpawn(command: string, args: string[] = [], options?: SpawnOptions, isFork: boolean = false): ChildProcess {
		const id = this.sessionId++;
		const newSess = new NewSessionMessage();
		newSess.setId(id);
		newSess.setCommand(command);
		newSess.setArgsList(args);
		newSess.setIsFork(isFork);
		if (options) {
			if (options.cwd) {
				newSess.setCwd(options.cwd);
			}
			if (options.env) {
				Object.keys(options.env).forEach((envKey) => {
					newSess.getEnvMap().set(envKey, options.env![envKey]);
				});
			}
			if (options.tty) {
				const tty = new TTYDimensions();
				tty.setHeight(options.tty.rows);
				tty.setWidth(options.tty.columns);
				newSess.setTtyDimensions(tty);
			}
		}
		const clientMsg = new ClientMessage();
		clientMsg.setNewSession(newSess);
		this.connection.send(clientMsg.serializeBinary());

		const serverProc = new ServerProcess(this.connection, id, options ? options.tty !== undefined : false);
		serverProc.stdin.on("close", () => {
			console.log("stdin closed");
			const c = new CloseSessionInputMessage();
			c.setId(id);
			const cm = new ClientMessage();
			cm.setCloseSessionInput(c);
			this.connection.send(cm.serializeBinary());
		});
		this.sessions.set(id, serverProc);
		return serverProc;
	}

	/**
	 * Handles a message from the server. All incoming server messages should be
	 * routed through here.
	 */
	private handleMessage(message: ServerMessage): void {
		if (message.hasEvalDone()) {
			this.evalDoneEmitter.emit(message.getEvalDone()!);
		} else if (message.hasEvalFailed()) {
			this.evalFailedEmitter.emit(message.getEvalFailed()!);
		} else if (message.hasNewSessionFailure()) {
			const s = this.sessions.get(message.getNewSessionFailure()!.getId());
			if (!s) {
				return;
			}
			s.emit("error", new Error(message.getNewSessionFailure()!.getMessage()));
			this.sessions.delete(message.getNewSessionFailure()!.getId());
		} else if (message.hasSessionDone()) {
			const s = this.sessions.get(message.getSessionDone()!.getId());
			if (!s) {
				return;
			}
			s.emit("exit", message.getSessionDone()!.getExitStatus());
			this.sessions.delete(message.getSessionDone()!.getId());
		} else if (message.hasSessionOutput()) {
			const output = message.getSessionOutput()!;
			const s = this.sessions.get(output.getId());
			if (!s) {
				return;
			}
			const data = new TextDecoder().decode(output.getData_asU8());
			const stream = output.getFd() === SessionOutputMessage.FD.STDOUT ? s.stdout : s.stderr;
			stream.emit("data", data);
		} else if (message.hasIdentifySession()) {
			const s = this.sessions.get(message.getIdentifySession()!.getId());
			if (!s) {
				return;
			}
			s.pid = message.getIdentifySession()!.getPid();
		}
	}
}
