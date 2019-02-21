import { Event, Emitter } from "@coder/events";
import { TunnelCloseCode } from "./common";

export interface TunnelCloseEvent {
	readonly code: TunnelCloseCode;
	readonly reason: string;
}

export interface ClientConnection {
	readonly onData: Event<ArrayBuffer>;
	readonly onClose: Event<TunnelCloseEvent>;
	send(data: ArrayBuffer): void;
}

export const forward = (connectionUrl: string): Promise<ClientConnection> => {
	return new Promise((resolve, reject): void => {
		const socket = new WebSocket(connectionUrl);
		const closeEmitter = new Emitter<TunnelCloseEvent>();
		const dataEmitter = new Emitter<ArrayBuffer>();
		const connection: ClientConnection = {
			get onClose(): Event<TunnelCloseEvent> {
				return closeEmitter.event;
			},
			get onData(): Event<ArrayBuffer> {
				return dataEmitter.event;
			},
			send(data: ArrayBuffer): void {
				socket.send(data);
			},
		};
		socket.binaryType = "arraybuffer";
		socket.addEventListener("message", (event) => {
			dataEmitter.emit(event.data);
		});
		socket.addEventListener("error", (event) => {
			reject("uncertain");
		});
		socket.addEventListener("open", () => {
			resolve(connection);
		});
		socket.addEventListener("close", (event) => {
			closeEmitter.emit({
				code: event.code,
				reason: event.reason,
			});
		});
	});
};
