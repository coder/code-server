import * as net from "net";
import { TunnelCloseCode } from "./common";

export interface WS {
	addEventListener(event: "message", cb: (event: {
		// tslint:disable-next-line:no-any
		readonly data: any;
	}) => void): void;
	addEventListener(event: "close", cb: () => void): void;
	binaryType: string;
	close(code: number, reason?: string): void;
	// tslint:disable-next-line:no-any
	send(data: any): void;
}

export const handle = async (socket: WS, port: number): Promise<void> => {
	const hosts = [
		"127.0.0.1",
		"::", // localhost
	];

	let localSocket: net.Socket | undefined;
	for (let i = 0; i < hosts.length; i++) {
		if (localSocket) {
			break;
		}
		localSocket = await new Promise((resolve, reject): void => {
			const socket = net.connect({
				host: hosts[i],
				port,
			}, () => {
				// Connected
				resolve(socket);
			});
			socket.on("error", (err: Error & { readonly code: string }) => {
				if (err.code === "ECONNREFUSED") {
					resolve(undefined);
				}
			});
		});
	}
	if (!localSocket) {
		socket.close(TunnelCloseCode.ConnectionRefused);

		return;
	}
	socket.binaryType = "arraybuffer";
	socket.addEventListener("message", (event) => localSocket!.write(Buffer.from(event.data)));
	socket.addEventListener("close", () => localSocket!.end());
	localSocket.on("data", (data) => socket.send(data));
	localSocket.on("error", (err) => socket.close(TunnelCloseCode.Error, err.toString()));
	localSocket.on("close", () => socket.close(TunnelCloseCode.Normal));
};
