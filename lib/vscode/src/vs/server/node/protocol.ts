import { field } from '@coder/logger';
import * as net from 'net';
import { VSBuffer } from 'vs/base/common/buffer';
import { PersistentProtocol } from 'vs/base/parts/ipc/common/ipc.net';
import { NodeSocket, WebSocketNodeSocket } from 'vs/base/parts/ipc/node/ipc.net';
import { AuthRequest, ConnectionTypeRequest, HandshakeMessage } from 'vs/platform/remote/common/remoteAgentConnection';
import { logger } from 'vs/server/node/logger';

export interface SocketOptions {
	readonly reconnectionToken: string;
	readonly reconnection: boolean;
	readonly skipWebSocketFrames: boolean;
	readonly permessageDeflate?: boolean;
	readonly inflateBytes?: VSBuffer;
	readonly recordInflateBytes?: boolean;
}

export class Protocol extends PersistentProtocol {
	public constructor(socket: net.Socket, public readonly options: SocketOptions) {
		super(
			options.skipWebSocketFrames
				? new NodeSocket(socket)
				: new WebSocketNodeSocket(
					new NodeSocket(socket),
					options.permessageDeflate || false,
					options.inflateBytes || null,
					options.recordInflateBytes || false,
				),
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
		logger.trace('Protocol handshake', field('token', this.options.reconnectionToken));
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				logger.error('Handshake timed out', field('token', this.options.reconnectionToken));
				reject(new Error('timed out'));
			}, 10000); // Matches the client timeout.

			const handler = this.onControlMessage((rawMessage) => {
				try {
					const raw = rawMessage.toString();
					logger.trace('Protocol message', field('token', this.options.reconnectionToken), field('message', raw));
					const message = JSON.parse(raw);
					switch (message.type) {
						case 'auth':
							return this.authenticate(message);
						case 'connectionType':
							handler.dispose();
							clearTimeout(timeout);
							return resolve(message);
						default:
							throw new Error('Unrecognized message type');
					}
				} catch (error) {
					handler.dispose();
					clearTimeout(timeout);
					reject(error);
				}
			});

			// Kick off the handshake in case we missed the client's opening shot.
			// TODO: Investigate why that message seems to get lost.
			this.authenticate();
		});
	}

	/**
	 * TODO: This ignores the authentication process entirely for now.
	 */
	private authenticate(_?: AuthRequest): void {
		this.sendMessage({ type: 'sign', data: '' });
	}

	/**
	 * TODO: implement.
	 */
	public tunnel(): void {
		throw new Error('Tunnel is not implemented yet');
	}

	/**
	 * Send a handshake message. In the case of the extension host, it just sends
	 * back a debug port.
	 */
	public sendMessage(message: HandshakeMessage | { debugPort?: number } ): void {
		this.sendControl(VSBuffer.fromString(JSON.stringify(message)));
	}
}
