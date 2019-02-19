import { EventEmitter } from "events";
import * as vm from "vm";
import { logger, field } from "@coder/logger";
import { NewEvalMessage, EvalFailedMessage, EvalDoneMessage, ServerMessage, EvalEventMessage } from "../proto";
import { SendableConnection } from "../common/connection";
import { stringify, parse } from "../common/util";

export interface ActiveEvaluation {
	onEvent(msg: EvalEventMessage): void;
	dispose(): void;
}

declare var __non_webpack_require__: typeof require;
export const evaluate = (connection: SendableConnection, message: NewEvalMessage, onDispose: () => void): ActiveEvaluation | void => {
	const argStr: string[] = [];
	message.getArgsList().forEach((value) => {
		argStr.push(value);
	});

	/**
	 * Send the response and call onDispose.
	 */
	// tslint:disable-next-line no-any
	const sendResp = (resp: any): void => {
		const evalDone = new EvalDoneMessage();
		evalDone.setId(message.getId());
		evalDone.setResponse(stringify(resp));

		const serverMsg = new ServerMessage();
		serverMsg.setEvalDone(evalDone);
		connection.send(serverMsg.serializeBinary());

		onDispose();
	};

	/**
	 * Send an exception and call onDispose.
	 */
	const sendException = (error: Error): void => {
		const evalFailed = new EvalFailedMessage();
		evalFailed.setId(message.getId());
		evalFailed.setReason(EvalFailedMessage.Reason.EXCEPTION);
		evalFailed.setMessage(error.toString() + " " + error.stack);

		const serverMsg = new ServerMessage();
		serverMsg.setEvalFailed(evalFailed);
		connection.send(serverMsg.serializeBinary());

		onDispose();
	};

	let eventEmitter = message.getActive() ? new EventEmitter(): undefined;
	const sandbox = {
		eventEmitter: eventEmitter ? {
			// tslint:disable no-any
			on: (event: string, cb: (...args: any[]) => void): void => {
				eventEmitter!.on(event, (...args: any[]) => {
					logger.trace(() => [
						`${event}`,
						field("id", message.getId()),
						field("args", args.map(stringify)),
					]);
					cb(...args);
				});
			},
			emit: (event: string, ...args: any[]): void => {
				logger.trace(() => [
					`emit ${event}`,
					field("id", message.getId()),
					field("args", args.map(stringify)),
				]);
				const eventMsg = new EvalEventMessage();
				eventMsg.setEvent(event);
				eventMsg.setArgsList(args.map(stringify));
				eventMsg.setId(message.getId());
				const serverMsg = new ServerMessage();
				serverMsg.setEvalEvent(eventMsg);
				connection.send(serverMsg.serializeBinary());
			},
			// tslint:enable no-any
		} : undefined,
		_Buffer: Buffer,
		require: typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require,
		setTimeout,
		setInterval,
		clearTimeout,
		process: {
			env: process.env,
		},
	};

	let value: any; // tslint:disable-line no-any
	try {
		const code = `(${message.getFunction()})(${eventEmitter ? "eventEmitter, " : ""}${argStr.join(",")});`;
		value = vm.runInNewContext(code, sandbox, {
			// If the code takes longer than this to return, it is killed and throws.
			timeout: message.getTimeout() || 15000,
		});
	} catch (ex) {
		sendException(ex);
	}

	// An evaluation completes when the value it returns resolves. An active
	// evaluation completes when it is disposed. Active evaluations are required
	// to return disposers so we can know both when it has ended (so we can clean
	// up on our end) and how to force end it (for example when the client
	// disconnects).
	// tslint:disable-next-line no-any
	const promise = !eventEmitter ? value as Promise<any> : new Promise((resolve): void => {
		value.onDidDispose(resolve);
	});
	if (promise && promise.then) {
		promise.then(sendResp).catch(sendException);
	} else {
		sendResp(value);
	}

	return eventEmitter ? {
		onEvent: (eventMsg: EvalEventMessage): void => {
			eventEmitter!.emit(eventMsg.getEvent(), ...eventMsg.getArgsList().map(parse));
		},
		dispose: (): void => {
			if (eventEmitter) {
				if (value && value.dispose) {
					value.dispose();
				}
				eventEmitter.removeAllListeners();
				eventEmitter = undefined;
			}
		},
	} : undefined;
};
