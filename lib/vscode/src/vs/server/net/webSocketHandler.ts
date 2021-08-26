/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createHash } from 'crypto';
import { IncomingHttpHeaders } from 'http';
import * as net from 'net';
import { Emitter } from 'vs/base/common/event';
import { ClientConnectionEvent } from 'vs/base/parts/ipc/common/ipc';
import { NodeSocket, WebSocketNodeSocket } from 'vs/base/parts/ipc/node/ipc.net';
import product from 'vs/platform/product/common/product';
import { ConnectionType, connectionTypeToString, IRemoteExtensionHostStartParams } from 'vs/platform/remote/common/remoteAgentConnection';
import { ConnectionOptions, parseQueryConnectionOptions } from 'vs/server/net/connection/abstractConnection';
import { ExtensionHostConnection } from 'vs/server/net/connection/extensionHostConnection';
import { ManagementConnection } from 'vs/server/net/connection/managementConnection';
import { ServerProtocol } from 'vs/server/protocol';
import { VSBuffer } from 'vs/base/common/buffer';
import { AbstractNetRequestHandler, ParsedRequest } from './abstractNetRequestHandler';

type Connection = ExtensionHostConnection | ManagementConnection;

export type UpgradeListener = (req: ParsedRequest, socket: net.Socket, head: Buffer) => void;

/**
 * Handles client connections to a editor instance via IPC.
 */
export class WebSocketHandler extends AbstractNetRequestHandler<UpgradeListener> {
	protected eventName = 'upgrade';
	private readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;

	private readonly maxExtraOfflineConnections = 0;
	private readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	/**
	 * Initializes connection map for this type of connection.
	 */
	private getCachedConnectionMap<T extends ConnectionType>(desiredConnectionType: T) {
		let connectionMap = this.connections.get(desiredConnectionType);

		if (!connectionMap) {
			connectionMap = new Map<string, Connection>();
			this.connections.set(desiredConnectionType, connectionMap);
		}

		return connectionMap;
	}

	protected eventListener: UpgradeListener = (req, socket, head) => {
		if (req.headers['upgrade'] !== 'websocket' || !req.url) {
			const errorMessage = `failed to upgrade for header "${req.headers['upgrade']}" and url: "${req.url}".`;
			this.logService.error(errorMessage);

			socket.end('HTTP/1.1 400 Bad Request');
			throw new Error(errorMessage);
		}

		this.logService.trace('Upgrade from', req.url, JSON.stringify(this.netServer?.address()));

		let connectionOptions: ConnectionOptions;

		try {
			connectionOptions = parseQueryConnectionOptions(req.parsedUrl.searchParams);
		} catch (error: unknown) {
			this.logService.error(error as Error);
			socket.end('HTTP/1.1 400 Bad Request');
			throw error;
		}

		socket.on('error', e => {
			this.logService.error(`[${connectionOptions.reconnectionToken}] Socket failed for "${req.url}".`, e);
		});

		const { responseHeaders, permessageDeflate } = createReponseHeaders(req.headers);
		socket.write(responseHeaders);

		const protocol = new ServerProtocol(new WebSocketNodeSocket(new NodeSocket(socket), permessageDeflate, null, permessageDeflate), this.logService, connectionOptions, VSBuffer.wrap(head));

		try {
			this.connect(protocol);
		} catch (error: any) {
			protocol.dispose(error.message);
		}
	};

	private async connect(protocol: ServerProtocol): Promise<void> {
		const message = await protocol.handshake();

		const clientVersion = message.commit;
		const serverVersion = product.commit;
		if (serverVersion && clientVersion !== serverVersion) {
			this.logService.warn(`Client version (${message.commit} does not match server version ${serverVersion})`);
		}

		// `desiredConnectionType` is marked as optional,
		// but it's a scenario we haven't yet seen.
		if (!message.desiredConnectionType) {
			throw new Error(`Expected desired connection type in protocol handshake: ${JSON.stringify(message)}`);
		}

		const connections = this.getCachedConnectionMap(message.desiredConnectionType);
		let connection = connections.get(protocol.reconnectionToken);
		const logPrefix = connectLogPrefix(message.desiredConnectionType, protocol);

		if (protocol.reconnection && connection) {
			this.logService.info(logPrefix, 'Client attempting to reconnect');
			return connection.reconnect(protocol);
		}

		// This probably means the process restarted so the session was lost
		// while the browser remained open.
		if (protocol.reconnection) {
			throw new Error(`Unable to reconnect; session no longer exists (${protocol.reconnectionToken})`);
		}

		// This will probably never happen outside a chance collision.
		if (connection) {
			throw new Error('Unable to connect; token is already in use');
		}

		// Now that the initial exchange has completed we can create the actual
		// connection on top of the protocol then send it to whatever uses it.
		this.logService.info(logPrefix, 'Client requesting connection');

		switch (message.desiredConnectionType) {
			case ConnectionType.Management:
				connection = new ManagementConnection(protocol, this.logService);

				// The management connection is used by firing onDidClientConnect
				// which makes the IPC server become aware of the connection.
				this._onDidClientConnect.fire(<ClientConnectionEvent>{
					protocol,
					onDidClientDisconnect: connection.onClose,
				});
				break;
			case ConnectionType.ExtensionHost:
				// The extension host connection is used by spawning an extension host
				// and then passing the socket into it.

				const startParams: IRemoteExtensionHostStartParams = {
					language: 'en',
					...message.args,
				};

				connection = new ExtensionHostConnection(protocol, this.logService, startParams, this.environmentService);

				await connection.spawn();
				break;
			case ConnectionType.Tunnel:
				return protocol.tunnel();
			default:
				throw new Error(`Unknown desired connection type ${message.desiredConnectionType}`);
		}

		connections.set(protocol.reconnectionToken, connection);
		connection.onClose(() => connections.delete(protocol.reconnectionToken));

		this.disposeOldOfflineConnections(connections);
		this.logService.debug(`${connections.size} active ${connection.name} connection(s)`);
	}

	private disposeOldOfflineConnections(connections: Map<string, Connection>): void {
		const offline = Array.from(connections.values()).filter(connection => typeof connection.offline !== 'undefined');
		for (let i = 0, max = offline.length - this.maxExtraOfflineConnections; i < max; ++i) {
			offline[i].dispose('old');
		}
	}
}

/** Magic number defined by Websocket spec. */
const WEBSOCKET_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function createReponseHeaders(incomingHeaders: IncomingHttpHeaders) {
	const acceptKey = incomingHeaders['sec-websocket-key'];
	// WebSocket standard hash suffix.
	const hash = createHash('sha1')
		.update(acceptKey + WEBSOCKET_MAGIC)
		.digest('base64');

	const responseHeaders = ['HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${hash}`];

	let permessageDeflate = false;

	if (String(incomingHeaders['sec-websocket-extensions']).indexOf('permessage-deflate') !== -1) {
		permessageDeflate = true;
		responseHeaders.push('Sec-WebSocket-Extensions: permessage-deflate; server_max_window_bits=15');
	}

	return {
		responseHeaders: responseHeaders.join('\r\n') + '\r\n\r\n',
		permessageDeflate,
	};
}

function connectLogPrefix(connectionType: ConnectionType, protocol: ServerProtocol) {
	return `[${connectionTypeToString(connectionType)}] ${protocol.logPrefix}`;
}
