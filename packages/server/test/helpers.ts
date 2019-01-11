import { Emitter } from "@coder/events";
import { Client } from "../src/browser/client";
import { Server } from "../src/node/server";

export const createClient = (): Client => {
	const s2c = new Emitter<Uint8Array | Buffer>();
	const c2s = new Emitter<Uint8Array | Buffer>();

	new Server({
		close: () => undefined,
		onClose: () => undefined,
		onMessage: (cb) => {
			c2s.event((d) => cb(d));
		},
		send: (data) => setTimeout(() => s2c.emit(data), 0),
	});

	const client = new Client({
		close: () => undefined,
		onClose: () => undefined,
		onMessage: (cb) => {
			s2c.event((d) => cb(d));
		},
		send: (data) => setTimeout(() => c2s.emit(data), 0),
	});

	return client;
};
