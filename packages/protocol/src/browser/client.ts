import { EventEmitter } from "events";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";
import { ReadWriteConnection, InitData, OperatingSystem, SharedProcessData } from "../common/connection";
import { Disposer, stringify, parse } from "../common/util";
import { NewEvalMessage, ServerMessage, EvalDoneMessage, EvalFailedMessage, ClientMessage, WorkingInitMessage, EvalEventMessage } from "../proto";
import { ActiveEval } from "./command";

/**
 * Client accepts an arbitrary connection intended to communicate with the Server.
 */
export class Client {
	private evalId = 0;
	private readonly evalDoneEmitter = new Emitter<EvalDoneMessage>();
	private readonly evalFailedEmitter = new Emitter<EvalFailedMessage>();
	private readonly evalEventEmitter = new Emitter<EvalEventMessage>();

	private _initData: InitData | undefined;
	private readonly initDataEmitter = new Emitter<InitData>();
	private readonly initDataPromise: Promise<InitData>;

	private readonly sharedProcessActiveEmitter = new Emitter<SharedProcessData>();
	public readonly onSharedProcessActive = this.sharedProcessActiveEmitter.event;

	/**
	 * @param connection Established connection to the server
	 */
	public constructor(
		private readonly connection: ReadWriteConnection,
	) {
		connection.onMessage((data) => {
			let message: ServerMessage | undefined;
			try {
				message = ServerMessage.deserializeBinary(data);
				this.handleMessage(message);
			} catch (error) {
				logger.error(
					"Failed to handle server message",
					field("id", message && message.hasEvalEvent() ? message.getEvalEvent()!.getId() : undefined),
					field("length", data.byteLength),
					field("error", error.message),
				);
			}
		});

		this.initDataPromise = new Promise((resolve): void => {
			this.initDataEmitter.event(resolve);
		});
	}

	public dispose(): void {
		this.connection.close();
	}

	public get initData(): Promise<InitData> {
		return this.initDataPromise;
	}

	public run(func: (ae: ActiveEval) => Disposer): ActiveEval;
	public run<T1>(func: (ae: ActiveEval, a1: T1) => Disposer, a1: T1): ActiveEval;
	public run<T1, T2>(func: (ae: ActiveEval, a1: T1, a2: T2) => Disposer, a1: T1, a2: T2): ActiveEval;
	public run<T1, T2, T3>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3) => Disposer, a1: T1, a2: T2, a3: T3): ActiveEval;
	public run<T1, T2, T3, T4>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3, a4: T4) => Disposer, a1: T1, a2: T2, a3: T3, a4: T4): ActiveEval;
	public run<T1, T2, T3, T4, T5>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => Disposer, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): ActiveEval;
	public run<T1, T2, T3, T4, T5, T6>(func: (ae: ActiveEval, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => Disposer, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): ActiveEval;
	/**
	 * Run a function on the server and provide an event emitter which allows
	 * listening and emitting to the emitter provided to that function. The
	 * function should return a disposer for cleaning up when the client
	 * disconnects and for notifying when disposal has happened outside manual
	 * activation.
	 */
	public run<T1, T2, T3, T4, T5, T6>(func: (ae: ActiveEval, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6) => Disposer, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6): ActiveEval {
		const doEval = this.doEvaluate(func, a1, a2, a3, a4, a5, a6, true);

		// This takes server events and emits them to the client's emitter.
		const eventEmitter = new EventEmitter();
		const d1 = this.evalEventEmitter.event((msg) => {
			if (msg.getId() === doEval.id) {
				eventEmitter.emit(msg.getEvent(), ...msg.getArgsList().map(parse));
			}
		});

		doEval.completed.then(() => {
			d1.dispose();
		}).catch((ex) => {
			d1.dispose();
			// This error event is only received by the client.
			eventEmitter.emit("error", ex);
		});

		// This takes client events and emits them to the server's emitter and
		// listens to events received from the server (via the event hook above).
		return {
			// tslint:disable no-any
			on: (event: string, cb: (...args: any[]) => void): EventEmitter => eventEmitter.on(event, cb),
			emit: (event: string, ...args: any[]): void => {
				const eventsMsg = new EvalEventMessage();
				eventsMsg.setId(doEval.id);
				eventsMsg.setEvent(event);
				eventsMsg.setArgsList(args.map(stringify));
				const clientMsg = new ClientMessage();
				clientMsg.setEvalEvent(eventsMsg);
				this.connection.send(clientMsg.serializeBinary());
			},
			removeAllListeners: (event: string): EventEmitter => eventEmitter.removeAllListeners(event),
			// tslint:enable no-any
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

	// tslint:disable-next-line no-any
	private doEvaluate<R, T1, T2, T3, T4, T5, T6>(func: (...args: any[]) => void | Promise<void> | R | Promise<R>, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6, active: boolean = false): {
		readonly completed: Promise<R>;
		readonly id: number;
	} {
		const newEval = new NewEvalMessage();
		const id = this.evalId++;
		newEval.setId(id);
		newEval.setActive(active);
		newEval.setArgsList([a1, a2, a3, a4, a5, a6].map(stringify));
		newEval.setFunction(func.toString());

		const clientMsg = new ClientMessage();
		clientMsg.setNewEval(newEval);
		this.connection.send(clientMsg.serializeBinary());

		const completed = new Promise<R>((resolve, reject): void => {
			const dispose = (): void => {
				d1.dispose();
				d2.dispose();
			};

			const d1 = this.evalDoneEmitter.event((doneMsg) => {
				if (doneMsg.getId() === id) {
					const resp = doneMsg.getResponse();
					dispose();
					resolve(parse(resp));
				}
			});

			const d2 = this.evalFailedEmitter.event((failedMsg) => {
				if (failedMsg.getId() === id) {
					dispose();
					reject(new Error(failedMsg.getMessage()));
				}
			});
		});

		return { completed, id };
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
				builtInExtensionsDirectory: init.getBuiltinExtensionsDir(),
			};
			this.initDataEmitter.emit(this._initData);
		} else if (message.hasEvalDone()) {
			this.evalDoneEmitter.emit(message.getEvalDone()!);
		} else if (message.hasEvalFailed()) {
			this.evalFailedEmitter.emit(message.getEvalFailed()!);
		} else if (message.hasEvalEvent()) {
			this.evalEventEmitter.emit(message.getEvalEvent()!);
		} else if (message.hasSharedProcessActive()) {
			const sharedProcessActiveMessage = message.getSharedProcessActive()!;
			this.sharedProcessActiveEmitter.emit({
				socketPath: sharedProcessActiveMessage.getSocketPath(),
				logPath: sharedProcessActiveMessage.getLogPath(),
			});
		}
	}
}
