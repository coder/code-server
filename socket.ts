import * as crypto from "crypto";
import * as net from "net";
import { AuthRequest, ConnectionType, ConnectionTypeRequest, HandshakeMessage } from "vs/platform/remote/common/remoteAgentConnection";
import { NodeSocket, WebSocketNodeSocket } from "vs/base/parts/ipc/node/ipc.net";
import { PersistentProtocol, ISocket } from "vs/base/parts/ipc/common/ipc.net";
import { VSBuffer } from "vs/base/common/buffer";
import { Connection, ExtensionHostConnection, ManagementConnection } from "vs/server/connection";

export interface SocketOptions {
	readonly reconnectionToken: string;
	readonly reconnection: boolean;
	readonly skipWebSocketFrames: boolean;
}

export interface Server {
	readonly connections: Map<ConnectionType, Map<string, Connection>>;
}

export class Socket {
	private nodeSocket: ISocket;
	public protocol: PersistentProtocol;

	public constructor(private readonly socket: net.Socket, private readonly options: SocketOptions) {
		socket.on("error", () => this.dispose());
		this.nodeSocket = new NodeSocket(socket);
		if (!this.options.skipWebSocketFrames) {
			this.nodeSocket = new WebSocketNodeSocket(this.nodeSocket as NodeSocket);
		}
		this.protocol = new PersistentProtocol(this.nodeSocket);
	}

	/**
	 * Upgrade the connection into a web socket.
	 */
	public upgrade(secWebsocketKey: string): void {
		// This magic value is specified by the websocket spec.
		const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
		const reply = crypto.createHash("sha1")
			.update(secWebsocketKey + magic)
			.digest("base64");

		this.socket.write([
			"HTTP/1.1 101 Switching Protocols",
			"Upgrade: websocket",
			"Connection: Upgrade",
			`Sec-WebSocket-Accept: ${reply}`,
		].join("\r\n") + "\r\n\r\n");
	}

	public dispose(): void {
		this.nodeSocket.dispose();
		this.protocol.dispose();
		this.nodeSocket = undefined!;
		this.protocol = undefined!;
	}

	public handshake(server: Server): void {
		const handler = this.protocol.onControlMessage((rawMessage) => {
			const message = JSON.parse(rawMessage.toString());
			switch (message.type) {
				case "auth": return this.authenticate(message);
				case "connectionType":
					handler.dispose();
					return this.connect(message, server);
				case "default":
					return this.dispose();
			}
		});
	}

	/**
	 * TODO: This ignores the authentication process entirely for now.
	 */
	private authenticate(_message: AuthRequest): void {
		this.sendControl({
			type: "sign",
			data: "",
		});
	}

	private connect(message: ConnectionTypeRequest, server: Server): void {
		switch (message.desiredConnectionType) {
			case ConnectionType.ExtensionHost:
			case ConnectionType.Management:
				const debugPort = this.getDebugPort();
				const ok = message.desiredConnectionType === ConnectionType.ExtensionHost
					? (debugPort ? { debugPort } : {})
					: { type: "ok" };

				if (!server.connections.has(message.desiredConnectionType)) {
					server.connections.set(message.desiredConnectionType, new Map());
				}

				const connections = server.connections.get(message.desiredConnectionType)!;

				if (this.options.reconnection && connections.has(this.options.reconnectionToken)) {
					this.sendControl(ok);
					const buffer = this.protocol.readEntireBuffer();
					this.protocol.dispose();
					return connections.get(this.options.reconnectionToken)!
						.reconnect(this.nodeSocket, buffer);
				}

				if (this.options.reconnection || connections.has(this.options.reconnectionToken)) {
					this.sendControl({
						type: "error",
						reason: this.options.reconnection
							? "Unrecognized reconnection token"
							: "Duplicate reconnection token",
					});
					return this.dispose();
				}

				this.sendControl(ok);

				const connection = message.desiredConnectionType === ConnectionType.Management
					? new ManagementConnection(this.protocol)
					: new ExtensionHostConnection(this.protocol);

				connections.set(this.options.reconnectionToken, connection);
				connection.onClose(() => {
					connections.delete(this.options.reconnectionToken);
				});
				break;
			case ConnectionType.Tunnel:
				return this.tunnel();
			default:
				this.sendControl({
					type: "error",
					reason: "Unrecognized connection type",
				});
				return this.dispose();
		}
	}

	/**
	 * TODO: implement.
	 */
	private tunnel(): void {
		this.sendControl({
			type: "error",
			reason: "Tunnel is not implemented yet",
		});
		this.dispose();
	}

	/**
	 * TODO: implement.
	 */
	private getDebugPort(): number | undefined {
		return undefined;
	}

	/**
	 * Send a handshake message. In the case of the extension host, it just sends
	 * back a debug port.
	 */
	private sendControl(message: HandshakeMessage | { debugPort?: number } ): void {
		this.protocol.sendControl(VSBuffer.fromString(JSON.stringify(message)));
	}
}
