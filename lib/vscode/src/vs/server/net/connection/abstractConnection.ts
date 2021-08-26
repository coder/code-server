/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { onUnexpectedError } from 'vs/base/common/errors';
import { Emitter } from 'vs/base/common/event';
import { ILogService } from 'vs/platform/log/common/log';
import { ServerProtocol } from 'vs/server/protocol';

export abstract class AbstractConnection {
	private readonly _onClose = new Emitter<void>();
	/**
	 * Fire when the connection is closed (not just disconnected). This should
	 * only happen when the connection is offline and old or has an error.
	 */
	public readonly onClose = this._onClose.event;
	private disposed = false;
	private _offline: number | undefined;

	protected get logPrefix() {
		return `[${this.name}] ${this.protocol.logPrefix}`;
	}

	public constructor(protected readonly protocol: ServerProtocol, protected readonly logService: ILogService, public readonly name: string) {
		this.logService.debug('Connecting...');
		this.onClose(() => this.logService.debug('Closed'));
	}

	public get offline(): number | undefined {
		return this._offline;
	}

	public reconnect(protocol: ServerProtocol): void {
		this.logService.debug(`${this.protocol.reconnectionToken} Reconnecting...`);
		this._offline = undefined;
		this.doReconnect(protocol);
	}

	public dispose(reason?: string): void {
		this.logService.debug(`${this.protocol.reconnectionToken} Disposing...`, reason);
		if (!this.disposed) {
			this.disposed = true;
			this.doDispose();
			this._onClose.fire();
		}
	}

	public safeDisposeProtocolAndSocket(): void {
		try {
			this.protocol.acceptDisconnect();
			const socket = this.protocol.getSocket();
			this.protocol.dispose();
			socket.dispose();
		} catch (err) {
			onUnexpectedError(err);
		}
	}

	protected setOffline(): void {
		this.logService.debug('Disconnected');
		if (!this._offline) {
			this._offline = Date.now();
		}
	}

	/**
	 * Set up the connection on a new socket.
	 */
	protected abstract doReconnect(protcol: ServerProtocol): void;

	/**
	 * Dispose/destroy everything permanently.
	 */
	protected abstract doDispose(): void;
}

/**
 * Connection options sent by the client via a remote agent connection.
 */
export interface ConnectionOptions {
	/** The token is how we identify and connect to existing sessions. */
	readonly reconnectionToken: string;
	/** Specifies that the client is trying to reconnect. */
	readonly reconnection: boolean;
	/** If true assume this is not a web socket (always false for code-server). */
	readonly skipWebSocketFrames: boolean;
}

/**
 * Convenience function to convert a client's query params into a useful object.
 */
export function parseQueryConnectionOptions(query: URLSearchParams): ConnectionOptions {
	const reconnectionToken = query.get('reconnectionToken');
	const reconnection = query.get('reconnection');
	const skipWebSocketFrames = query.get('skipWebSocketFrames');

	if (typeof reconnectionToken !== 'string') {
		throw new Error('`reconnectionToken` not present in query');
	}

	if (typeof reconnection !== 'string') {
		throw new Error('`reconnection` not present in query');
	}

	if (typeof skipWebSocketFrames !== 'string') {
		throw new Error('`skipWebSocketFrames` not present in query');
	}

	return {
		reconnectionToken,
		reconnection: reconnection === 'true',
		skipWebSocketFrames: skipWebSocketFrames === 'true',
	};
}
