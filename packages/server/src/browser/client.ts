import { ReadWriteConnection } from "../common/connection";
import { NewEvalMessage, ServerMessage, EvalDoneMessage, EvalFailedMessage, TypedValue, ClientMessage } from "../proto";
import { Emitter } from "@coder/events";
import { logger, field } from "@coder/logger";


export class Client {

	private evalId: number = 0;
	private evalDoneEmitter: Emitter<EvalDoneMessage> = new Emitter();
	private evalFailedEmitter: Emitter<EvalFailedMessage> = new Emitter();

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

	public evaluate<R>(func: () => R): Promise<R>;
	public evaluate<R, T1>(func: (a1: T1) => R, a1: T1): Promise<R>;
	public evaluate<R, T1, T2>(func: (a1: T1, a2: T2) => R, a1: T1, a2: T2): Promise<R>;
	public evaluate<R, T1, T2, T3>(func: (a1: T1, a2: T2, a3: T3) => R, a1: T1, a2: T2, a3: T3): Promise<R>;
	public evaluate<R, T1, T2, T3, T4>(func: (a1: T1, a2: T2, a3: T3, a4: T4) => R, a1: T1, a2: T2, a3: T3, a4: T4): Promise<R>;
	public evaluate<R, T1, T2, T3, T4, T5>(func: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): Promise<R>;
	public evaluate<R, T1, T2, T3, T4, T5, T6>(func: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): Promise<R>;
	public evaluate<R, T1, T2, T3, T4, T5, T6>(func: (a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6) => R, a1?: T1, a2?: T2, a3?: T3, a4?: T4, a5?: T5, a6?: T6): Promise<R> {
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
	
	private handleMessage(message: ServerMessage): void {
		if (message.hasEvalDone()) {
			this.evalDoneEmitter.emit(message.getEvalDone()!);
		} else if (message.hasEvalFailed()) {
			this.evalFailedEmitter.emit(message.getEvalFailed()!);
		}
	}

}
