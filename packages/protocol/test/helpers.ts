import { Emitter } from "@coder/events";
import { Client } from "../src/browser/client";
import { Server, ServerOptions } from "../src/node/server";

export const createClient = (serverOptions?: ServerOptions): Client => {
	const s2c = new Emitter<Uint8Array | Buffer>();
	const c2s = new Emitter<Uint8Array | Buffer>();
	const closeCallbacks = <Array<() => void>>[];

	// tslint:disable-next-line no-unused-expression
	new Server({
		close: (): void => closeCallbacks.forEach((cb) => cb()),
		onClose: (cb: () => void): number => closeCallbacks.push(cb),
		onMessage: (cb): void => {
			c2s.event((d) => cb(d));
		},
		send: (data): NodeJS.Timer => setTimeout(() => s2c.emit(data), 0),
	}, serverOptions);

	const client = new Client({
		close: (): void => closeCallbacks.forEach((cb) => cb()),
		onClose: (cb: () => void): number => closeCallbacks.push(cb),
		onMessage: (cb): void => {
			s2c.event((d) => cb(d));
		},
		send: (data): NodeJS.Timer => setTimeout(() => c2s.emit(data), 0),
	});

	return client;
};
