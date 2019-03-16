import { fork as cpFork } from "child_process";
import { EventEmitter } from "events";
import * as vm from "vm";
import { logger, field } from "@coder/logger";
import { NewEvalMessage, EvalFailedMessage, EvalDoneMessage, ServerMessage, EvalEventMessage } from "../proto";
import { SendableConnection } from "../common/connection";
import { ServerActiveEvalHelper, EvalHelper, ForkProvider, Modules } from "../common/helpers";
import { stringify, parse } from "../common/util";

export interface ActiveEvaluation {
	onEvent(msg: EvalEventMessage): void;
	dispose(): void;
}

declare var __non_webpack_require__: typeof require;
export const evaluate = (connection: SendableConnection, message: NewEvalMessage, onDispose: () => void, fork?: ForkProvider): ActiveEvaluation | void => {
	/**
	 * Send the response and call onDispose.
	 */
	// tslint:disable-next-line no-any
	const sendResp = (resp: any): void => {
		logger.trace(() => [
			"resolve",
			field("id", message.getId()),
			field("response", stringify(resp)),
		]);

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
		logger.trace(() => [
			"reject",
			field("id", message.getId()),
			field("response", stringify(error, true)),
		]);

		const evalFailed = new EvalFailedMessage();
		evalFailed.setId(message.getId());
		evalFailed.setResponse(stringify(error, true));

		const serverMsg = new ServerMessage();
		serverMsg.setEvalFailed(evalFailed);
		connection.send(serverMsg.serializeBinary());

		onDispose();
	};

	const modules: Modules = {
		spdlog: require("spdlog"),
		pty: require("node-pty-prebuilt"),
		trash: require("trash"),
	};

	let eventEmitter = message.getActive() ? new EventEmitter(): undefined;
	const sandbox = {
		helper: eventEmitter ? new ServerActiveEvalHelper(modules, {
			removeAllListeners: (event?: string): void => {
				eventEmitter!.removeAllListeners(event);
			},
			// tslint:disable no-any
			on: (event: string, cb: (...args: any[]) => void): void => {
				eventEmitter!.on(event, (...args: any[]) => {
					logger.trace(() => [
						`${event}`,
						field("id", message.getId()),
						field("args", args.map((a) => stringify(a))),
					]);
					cb(...args);
				});
			},
			emit: (event: string, ...args: any[]): void => {
				logger.trace(() => [
					`emit ${event}`,
					field("id", message.getId()),
					field("args", args.map((a) => stringify(a))),
				]);
				const eventMsg = new EvalEventMessage();
				eventMsg.setEvent(event);
				eventMsg.setArgsList(args.map((a) => stringify(a)));
				eventMsg.setId(message.getId());
				const serverMsg = new ServerMessage();
				serverMsg.setEvalEvent(eventMsg);
				connection.send(serverMsg.serializeBinary());
			},
			// tslint:enable no-any
		}, fork || cpFork) : new EvalHelper(modules),
		_Buffer: Buffer,
		// When the client is ran from Webpack, it will replace
		// __non_webpack_require__ with require, which we then need to provide to
		// the sandbox. Since the server might also be using Webpack, we need to set
		// it to the non-Webpack version when that's the case. Then we need to also
		// provide __non_webpack_require__ for when the client doesn't run through
		// Webpack meaning it doesn't get replaced with require (Jest for example).
		require: typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require,
		__non_webpack_require__: typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require,
		setTimeout,
		setInterval,
		clearTimeout,
		process: {
			env: process.env,
		},
		args: message.getArgsList().map(parse),
	};

	let value: any; // tslint:disable-line no-any
	try {
		const code = `(${message.getFunction()})(helper, ...args);`;
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
