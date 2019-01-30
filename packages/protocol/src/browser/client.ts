import { ReadWriteConnection, InitData, OperatingSystem, ISharedProcessData } from "../common/connection";
import { NewEvalMessage, ServerMessage, EvalDoneMessage, EvalFailedMessage, TypedValue, ClientMessage, NewSessionMessage, TTYDimensions, SessionOutputMessage, CloseSessionInputMessage, WorkingInitMessage, EvalEventMessage } from "../proto";
import { Emitter, Event } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ChildProcess, SpawnOptions, ForkOptions, ServerProcess, ServerSocket, Socket, ServerListener, Server, ActiveEval } from "./command";
import { EventEmitter } from "events";

/**
 * Client accepts an arbitrary connection intended to communicate with the Server.
 */
export class Client {

	public Socket: typeof ServerSocket;

	private evalId: number = 0;
	private evalDoneEmitter: Emitter<EvalDoneMessage> = new Emitter();
	private evalFailedEmitter: Emitter<EvalFailedMessage> = new Emitter();
	private evalEventEmitter: Emitter<EvalEventMessage> = new Emitter();

	private sessionId: number = 0;
	private readonly sessions: Map<number, ServerProcess> = new Map();

	private connectionId: number = 0;
	private readonly connections: Map<number, ServerSocket> = new Map();

	private serverId: number = 0;
	private readonly servers: Map<number, ServerListener> = new Map();

	private _initData: InitData | undefined;
	private initDataEmitter = new Emitter<InitData>();
	private initDataPromise: Promise<InitData>;

	private sharedProcessActiveEmitter = new Emitter<ISharedProcessData>();

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

		const that = this;
		this.Socket = class extends ServerSocket {

			public constructor() {
				super(that.connection, that.connectionId++, that.registerConnection);
			}

		};

		this.initDataPromise = new Promise((resolve): void => {
			this.initDataEmitter.event(resolve);
		});
	}

	public get initData(): Promise<InitData> {
		return this.initDataPromise;
	}

	public get onSharedProcessActive(): Event<ISharedProcessData> {
		return this.sharedProcessActiveEmitter.event;
	}

	public run(func: (ae: ActiveEval) => void | Promise<void>): ActiveEval;
	public run<T1>(func: (ae: ActiveEval, a1: T1) => void | Promise<void>, a1: T1): ActiveEval;
	public run<T1, T2>(func: (ae: ActiveEval, a1: T1, a2: T2) => void | Promise<void>, a1: T1, a2: T2): ActiveEval;
	public run<T1, T2, T3>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3) => void | Promise<void>, a1: T1, a2: T2, a3: T3): ActiveEval;
	public run<T1, T2, T3, T4>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3, a4: T4) => void | Promise<void>, a1: T1, a2: T2, a3: T3, a4: T4): ActiveEval;
	public run<T1, T2, T3, T4, T5>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => void | Promise<void>, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): ActiveEval;
	public run<T1, T2, T3, T4, T5, T6>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => void | Promise<void>, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): ActiveEval;

	public run<T1, T2, T3, T4, T5, T6>(func: (ae: ActiveEval, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6) => void | Promise<void>, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6): ActiveEval {
		const doEval = this.doEvaluate(func, a1, a2, a3, a4, a5, a6, true);
		const eventEmitter = new EventEmitter();
		const d1 = this.evalEventEmitter.event((msg) => {
			if (msg.getId() !== doEval.id) {
				return;
			}

			eventEmitter.emit(msg.getEvent(), ...msg.getArgsList().filter(a => a).map(s => JSON.parse(s)));
		});

		doEval.completed.then(() => {
			d1.dispose();
			eventEmitter.emit("close");
		}).catch((ex) => {
			d1.dispose();
			eventEmitter.emit("error", ex);
		});

		return {
			on: (event: string, cb: (...args: any[]) => void) => eventEmitter.on(event, cb),
			emit: (event: string, ...args: any[]) => {
				const eventsMsg = new EvalEventMessage();
				eventsMsg.setId(doEval.id);
				eventsMsg.setEvent(event);
				eventsMsg.setArgsList(args.filter(a => a).map(a => JSON.stringify(a)));
				const clientMsg = new ClientMessage();
				clientMsg.setEvalEvent(eventsMsg);
				this.connection.send(clientMsg.serializeBinary());
			},
		};
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
	 * @returns Promise rejected or resolved from the evaluated function
	 */
	public evaluate<R, T1, T2, T3, T4, T5, T6>(func: (a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6) => R | Promise<R>, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6): Promise<R> {
		return this.doEvaluate(func, a1, a2, a3, a4, a5, a6, false).completed;
	}

	private doEvaluate<R, T1, T2, T3, T4, T5, T6>(func: (...args: any[]) => void | Promise<void> | R | Promise<R>, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6, active: boolean = false): {
		readonly completed: Promise<R>;
		readonly id: number;
	} {
		const newEval = new NewEvalMessage();
		const id = this.evalId++;
		newEval.setId(id);
		newEval.setActive(active);
		newEval.setArgsList([a1, a2, a3, a4, a5, a6].filter(a => typeof a !== "undefined").map(a => JSON.stringify(a)));
		newEval.setFunction(func.toString());

		const clientMsg = new ClientMessage();
		clientMsg.setNewEval(newEval);
		this.connection.send(clientMsg.serializeBinary());

		let res: (value?: R) => void;
		let rej: (err?: Error) => void;
		const prom = new Promise<R>((r, e): void => {
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
				// tslint:disable-next-line
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

				rej(new Error(failedMsg.getMessage()));
			}
		});

		return {
			completed: prom,
			id,
		};
	}

	/**
	 * Spawns a process from a command. _Somewhat_ reflects the "child_process" API.
	 * @example
	 * const cp = this.client.spawn("echo", ["test"]);
	 * cp.stdout.on("data", (data) => console.log(data.toString()));
	 * cp.on("exit", (code) => console.log("exited with", code));
	 * @param args Arguments
	 * @param options Options to execute for the command
	 */
	public spawn(command: string, args: string[] = [], options?: SpawnOptions): ChildProcess {
		return this.doSpawn(command, args, options, false, false);
	}

	/**
	 * Fork a module.
	 * @param modulePath Path of the module
	 * @param args Args to add for the module
	 * @param options Options to execute
	 */
	public fork(modulePath: string, args: string[] = [], options?: ForkOptions): ChildProcess {
		return this.doSpawn(modulePath, args, options, true);
	}

	/**
	 * VS Code specific.
	 * Forks a module from bootstrap-fork
	 * @param modulePath Path of the module
	 */
	public bootstrapFork(modulePath: string, args: string[] = [], options?: ForkOptions): ChildProcess {
		return this.doSpawn(modulePath, args, options, true, true);
	}

	public createConnection(path: string, callback?: Function): Socket;
	public createConnection(port: number, callback?: Function): Socket;
	public createConnection(target: string | number, callback?: Function): Socket;
	public createConnection(target: string | number, callback?: Function): Socket {
		const id = this.connectionId++;
		const socket = new ServerSocket(this.connection, id, this.registerConnection);
		socket.connect(target, callback);

		return socket;
	}

	public createServer(callback?: () => void): Server {
		const id = this.serverId++;
		const server = new ServerListener(this.connection, id, callback);
		this.servers.set(id, server);

		return server;
	}

	private doSpawn(command: string, args: string[] = [], options?: SpawnOptions, isFork: boolean = false, isBootstrapFork: boolean = true): ChildProcess {
		const id = this.sessionId++;
		const newSess = new NewSessionMessage();
		newSess.setId(id);
		newSess.setCommand(command);
		newSess.setArgsList(args);
		newSess.setIsFork(isFork);
		newSess.setIsBootstrapFork(isBootstrapFork);
		if (options) {
			if (options.cwd) {
				newSess.setCwd(options.cwd);
			}
			if (options.env) {
				Object.keys(options.env).forEach((envKey) => {
					if (options.env![envKey]) {
						newSess.getEnvMap().set(envKey, options.env![envKey].toString());
					}
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

		const serverProc = new ServerProcess(this.connection, id, options ? options.tty !== undefined : false, isBootstrapFork);
		serverProc.stdin.on("close", () => {
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
			};
			this.initDataEmitter.emit(this._initData);
		} else if (message.hasEvalDone()) {
			this.evalDoneEmitter.emit(message.getEvalDone()!);
		} else if (message.hasEvalFailed()) {
			this.evalFailedEmitter.emit(message.getEvalFailed()!);
		} else if (message.hasEvalEvent()) {
			this.evalEventEmitter.emit(message.getEvalEvent()!);
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
			const source = output.getSource();
			switch (source) {
				case SessionOutputMessage.Source.STDOUT:
				case SessionOutputMessage.Source.STDERR:
					(source === SessionOutputMessage.Source.STDOUT ? s.stdout : s.stderr).emit("data", data);
					break;
				case SessionOutputMessage.Source.IPC:
					s.emit("message", JSON.parse(data));
					break;
				default:
					throw new Error(`Unknown source ${source}`);
			}
		} else if (message.hasIdentifySession()) {
			const s = this.sessions.get(message.getIdentifySession()!.getId());
			if (!s) {
				return;
			}
			const pid = message.getIdentifySession()!.getPid();
			if (typeof pid !== "undefined") {
				s.pid = pid;
			}
			const title = message.getIdentifySession()!.getTitle();
			if (typeof title !== "undefined") {
				s.title = title;
			}
		} else if (message.hasConnectionEstablished()) {
			const c = this.connections.get(message.getConnectionEstablished()!.getId());
			if (!c) {
				return;
			}
			c.emit("connect");
		} else if (message.hasConnectionOutput()) {
			const c = this.connections.get(message.getConnectionOutput()!.getId());
			if (!c) {
				return;
			}
			c.emit("data", Buffer.from(message.getConnectionOutput()!.getData_asU8()));
		} else if (message.hasConnectionClose()) {
			const c = this.connections.get(message.getConnectionClose()!.getId());
			if (!c) {
				return;
			}
			c.emit("close");
			c.emit("end");
			this.connections.delete(message.getConnectionClose()!.getId());
		} else if (message.hasConnectionFailure()) {
			const c = this.connections.get(message.getConnectionFailure()!.getId());
			if (!c) {
				return;
			}
			c.emit("end");
			this.connections.delete(message.getConnectionFailure()!.getId());
		} else if (message.hasSharedProcessActive()) {
			this.sharedProcessActiveEmitter.emit({
				socketPath: message.getSharedProcessActive()!.getSocketPath(),
				logPath: message.getSharedProcessActive()!.getLogPath(),
			});
		} else if (message.hasServerEstablished()) {
			const s = this.servers.get(message.getServerEstablished()!.getId());
			if (!s) {
				return;
			}
			s.emit("connect");
		} else if (message.hasServerConnectionEstablished()) {
			const s = this.servers.get(message.getServerConnectionEstablished()!.getServerId());
			if (!s) {
				return;
			}
			const conId = message.getServerConnectionEstablished()!.getConnectionId();
			const serverSocket = new ServerSocket(this.connection, conId, this.registerConnection);
			this.registerConnection(conId, serverSocket);
			serverSocket.emit("connect");
			s.emit("connection", serverSocket);
		} else if (message.getServerFailure()) {
			const s = this.servers.get(message.getServerFailure()!.getId());
			if (!s) {
				return;
			}
			s.emit("error", new Error(message.getNewSessionFailure()!.getReason().toString()));
			this.servers.delete(message.getNewSessionFailure()!.getId());
		} else if (message.hasServerClose()) {
			const s = this.servers.get(message.getServerClose()!.getId());
			if (!s) {
				return;
			}
			s.emit("close");
			this.servers.delete(message.getServerClose()!.getId());
		}
	}

	private registerConnection = (id: number, socket: ServerSocket): void => {
		if (this.connections.has(id)) {
			throw new Error(`${id} is already registered`);
		}
		this.connections.set(id, socket);
	}

}
