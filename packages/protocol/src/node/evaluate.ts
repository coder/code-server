import * as vm from "vm";
import { NewEvalMessage, TypedValue, EvalFailedMessage, EvalDoneMessage, ServerMessage, EvalEventMessage } from "../proto";
import { SendableConnection } from "../common/connection";
import { EventEmitter } from "events";

export interface ActiveEvaluation {
	onEvent(msg: EvalEventMessage): void;
}

declare var __non_webpack_require__: typeof require;
export const evaluate = (connection: SendableConnection, message: NewEvalMessage, onDispose: () => void): ActiveEvaluation | void => {
	const argStr: string[] = [];
	message.getArgsList().forEach((value) => {
		argStr.push(value);
	});
	const sendResp = (resp: any): void => {
		const evalDone = new EvalDoneMessage();
		evalDone.setId(message.getId());
		const tof = typeof resp;
		if (tof !== "undefined") {
			const tv = new TypedValue();
			let t: TypedValue.Type;
			switch (tof) {
				case "string":
					t = TypedValue.Type.STRING;
					break;
				case "boolean":
					t = TypedValue.Type.BOOLEAN;
					break;
				case "object":
					t = TypedValue.Type.OBJECT;
					break;
				case "number":
					t = TypedValue.Type.NUMBER;
					break;
				default:
					return sendErr(EvalFailedMessage.Reason.EXCEPTION, `unsupported response type ${tof}`);
			}
			tv.setValue(tof === "string" ? resp : JSON.stringify(resp));
			tv.setType(t);
			evalDone.setResponse(tv);
		}

		const serverMsg = new ServerMessage();
		serverMsg.setEvalDone(evalDone);
		connection.send(serverMsg.serializeBinary());
	};
	const sendErr = (reason: EvalFailedMessage.Reason, msg: string): void => {
		const evalFailed = new EvalFailedMessage();
		evalFailed.setId(message.getId());
		evalFailed.setReason(reason);
		evalFailed.setMessage(msg);

		const serverMsg = new ServerMessage();
		serverMsg.setEvalFailed(evalFailed);
		connection.send(serverMsg.serializeBinary());
	};
	let eventEmitter: EventEmitter | undefined;
	try {
		if (message.getActive()) {
			eventEmitter = new EventEmitter();
		}

		const value = vm.runInNewContext(`(${message.getFunction()})(${eventEmitter ? `eventEmitter, ` : ""}${argStr.join(",")})`, {
			eventEmitter: eventEmitter ? {
				on: (event: string, cb: (...args: any[]) => void): void => {
					eventEmitter!.on(event, cb);
				},
				emit: (event: string, ...args: any[]): void => {
					const eventMsg = new EvalEventMessage();
					eventMsg.setEvent(event);
					eventMsg.setArgsList(args.filter(a => a).map(a => JSON.stringify(a)));
					eventMsg.setId(message.getId());
					const serverMsg = new ServerMessage();
					serverMsg.setEvalEvent(eventMsg);
					connection.send(serverMsg.serializeBinary());
				},
			} : undefined,
			_Buffer: Buffer,
			require: typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require,
			_require: typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require,
			tslib_1: require("tslib"), // TODO: is there a better way to do this?
			setTimeout,
		}, {
				timeout: message.getTimeout() || 15000,
			});
		if (eventEmitter) {
			// Is an active evaluation and should NOT be ended
			eventEmitter.on("close", () => onDispose());
			eventEmitter.on("error", () => onDispose());
		} else {
			if ((value as Promise<void>).then) {
				// Is promise
				(value as Promise<void>).then(r => sendResp(r)).catch(ex => sendErr(EvalFailedMessage.Reason.EXCEPTION, ex.toString()));
			} else {
				sendResp(value);
			}
			onDispose();
		}
	} catch (ex) {
		sendErr(EvalFailedMessage.Reason.EXCEPTION, ex.toString() + " " + ex.stack);
	}

	return eventEmitter ? {
		onEvent: (eventMsg: EvalEventMessage): void => {
			eventEmitter!.emit(eventMsg.getEvent(), ...eventMsg.getArgsList().map(a => JSON.parse(a)));
		},
	} : undefined;
};
