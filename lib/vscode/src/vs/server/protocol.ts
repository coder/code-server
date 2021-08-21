/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SendHandle } from 'child_process';
import * as net from 'net';
import { VSBuffer } from 'vs/base/common/buffer';
import { ISocket, PersistentProtocol } from 'vs/base/parts/ipc/common/ipc.net';
import { WebSocketNodeSocket } from 'vs/base/parts/ipc/node/ipc.net';
import { ConsoleLogger } from 'vs/platform/log/common/log';
import { ConnectionTypeRequest, HandshakeMessage } from 'vs/platform/remote/common/remoteAgentConnection';
import { ConnectionOptions } from 'vs/server/connection/abstractConnection';

/**
 * Matches `remoteAgentConnection.ts#connectToRemoteExtensionHostAgent`
 */
const HANDSHAKE_TIMEOUT_DURATION = 10000;

/**
 * Trims a long token for a cleaner logging.
 */
export function trimConnectionToken(token: string): string {
	return `${token.slice(0, 3)}...${token.slice(-3)}`;
}

/**
 * This server-side protocol is the complement of the client-side `PersistentConnection`.
 */
export class ServerProtocol extends PersistentProtocol {
	public readonly logPrefix: string;

	constructor(
		socket: ISocket,
		private readonly logger: ConsoleLogger,
		private readonly options: ConnectionOptions,
		// `initialChunk` is likely not used.
		initialChunk?: VSBuffer | null,
	) {
		super(socket, initialChunk);

		this.logPrefix = `[${trimConnectionToken(this.reconnectionToken)}]`;
	}

	public override getSocket() {
		return super.getSocket() as WebSocketNodeSocket;
	}

	/**
	 * Used when passing the underlying socket to a child process.
	 *
	 * @remark this may be undefined if the socket or its parent container is disposed.
	 */
	private getSendHandle(): net.Socket | undefined {
		return this.getSocket().socket.socket;
	}

	public get reconnectionToken() {
		return this.options.reconnectionToken;
	}

	public get reconnection() {
		return this.options.reconnection;
	}

	public get skipWebSocketFrames() {
		return this.options.skipWebSocketFrames;
	}

	/**
	 * Perform a handshake to get a connection request.
	 */
	public handshake(): Promise<ConnectionTypeRequest> {
		this.logger.debug(this.logPrefix, '(Handshake 1/4)', 'Waiting for client authentication...');

		return new Promise((resolve, reject) => {
			const cleanup = () => {
				onControlMessageHandler.dispose();
				onClose.dispose();
				clearTimeout(handshakeTimeout);
			};

			const onClose = this.onSocketClose(() => {
				cleanup();
				this.logger.error('Handshake failed');
				reject(new Error('Protocol socket closed unexpectedly'));
			});

			const handshakeTimeout = setTimeout(() => {
				cleanup();
				this.logger.error('Handshake timed out');
				reject(new Error('Protocol handshake timed out'));
			}, HANDSHAKE_TIMEOUT_DURATION);

			const onControlMessageHandler = this.onControlMessage(rawMessage => {
				try {
					const raw = rawMessage.toString();
					const message: HandshakeMessage = JSON.parse(raw);

					switch (message.type) {
						case 'auth':
							this.logger.debug(this.logPrefix, '(Handshake 2/4)', 'Client auth received!');
							this.sendMessage({ type: 'sign', data: message.auth });
							this.logger.debug(this.logPrefix, '(Handshake 3/4)', 'Sent client signed auth...');
							break;
						case 'connectionType':
							cleanup();
							this.logger.debug(this.logPrefix, '(Handshake 4/4)', 'Client has requested a connection!');
							resolve(message);
						default:
							throw new Error('Unrecognized message type');
					}
				} catch (error) {
					cleanup();
					reject(error);
				}
			});
		});
	}

	/**
	 * TODO: implement.
	 */
	public tunnel(): void {
		throw new Error('Tunnel is not implemented yet');
	}

	/**
	 * Send a handshake message as a VSBuffer.
	 * @remark In the case of ExtensionHost it should only send a debug port.
	 */
	public sendMessage(message: HandshakeMessage): void {
		this.logger.debug(this.logPrefix, `Sending control message to client (${message.type})`);
		this.sendControl(VSBuffer.fromString(JSON.stringify(message)));
	}

	/**
	 * Disconnect and dispose protocol.
	 */
	public override dispose(errorReason?: string): void {
		try {
			if (errorReason) {
				this.sendMessage({ type: 'error', reason: errorReason });
			}

			// If still connected try notifying the client.
			this.sendDisconnect();
		} catch (error) {
			// I think the write might fail if already disconnected.
			this.logger.warn(error.message || error);
		}

		// This disposes timers and socket event handlers.
		super.dispose();
	}

	/**
	 * Suspends protocol in preparation for socket passing to a child process
	 * @remark This will partially dispose the protocol!
	 */
	public suspend(): { initialDataChunk: VSBuffer; sendHandle: SendHandle } {
		const sendHandle = this.getSendHandle();

		if (!sendHandle) {
			throw new Error('Send handle is not present in protocol. Was it disposed?');
		}
		const initialDataChunk = this.readEntireBuffer();

		// This disposes timers and socket event handlers.
		super.dispose();
		sendHandle.pause();
		this.getSocket().drain();

		return {
			initialDataChunk,
			sendHandle,
		};
	}

	/**
	 * Get inflateBytes from the current socket.
	 * Seed zlib with these bytes (web socket only). If parts of inflating was
	 * done in a different zlib instance we need to pass all those bytes into zlib
	 * otherwise the inflate might hit an inflated portion referencing a distance
	 * too far back.
	 */
	public get inflateBytes() {
		const socket = this.getSocket();
		return socket.recordedInflateBytes;
	}
}
