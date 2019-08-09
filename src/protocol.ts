import * as net from "net";
import { VSBuffer } from "vs/base/common/buffer";
import { PersistentProtocol } from "vs/base/parts/ipc/common/ipc.net";
import { NodeSocket, WebSocketNodeSocket } from "vs/base/parts/ipc/node/ipc.net";
import { AuthRequest, ConnectionTypeRequest, HandshakeMessage } from "vs/platform/remote/common/remoteAgentConnection";

export interface SocketOptions {
	readonly reconnectionToken: string;
	readonly reconnection: boolean;
	readonly skipWebSocketFrames: boolean;
}

export class Protocol extends PersistentProtocol {
	public constructor(socket: net.Socket, public readonly options: SocketOptions) {
		super(
			options.skipWebSocketFrames
				? new NodeSocket(socket)
				: new WebSocketNodeSocket(new NodeSocket(socket)),
		);
	}

	public getUnderlyingSocket(): net.Socket {
		const socket = this.getSocket();
		return socket instanceof NodeSocket
			? socket.socket
			: (socket as WebSocketNodeSocket).socket.socket;
	}

	/**
	 * Perform a handshake to get a connection request.
	 */
	public handshake(): Promise<ConnectionTypeRequest> {
		return new Promise((resolve, reject) => {
			const handler = this.onControlMessage((rawMessage) => {
				try {
					const message = JSON.parse(rawMessage.toString());
					switch (message.type) {
						case "auth": return this.authenticate(message);
						case "connectionType":
							handler.dispose();
							return resolve(message);
						default: throw new Error("Unrecognized message type");
					}
				} catch (error) {
					handler.dispose();
					reject(error);
				}
			});
		});
	}

	/**
	 * TODO: This ignores the authentication process entirely for now.
	 */
	private authenticate(_message: AuthRequest): void {
		this.sendMessage({ type: "sign", data: "" });
	}

	/**
	 * TODO: implement.
	 */
	public tunnel(): void {
		throw new Error("Tunnel is not implemented yet");
	}

	/**
	 * Send a handshake message. In the case of the extension host, it just sends
	 * back a debug port.
	 */
	public sendMessage(message: HandshakeMessage | { debugPort?: number } ): void {
		this.sendControl(VSBuffer.fromString(JSON.stringify(message)));
	}
}
