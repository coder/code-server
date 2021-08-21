/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConsoleLogger } from 'vs/platform/log/common/log';
import { AbstractConnection } from 'vs/server/connection/abstractConnection';
import { ServerProtocol } from 'vs/server/protocol';

/**
 * Used for all the IPC channels.
 */
export class ManagementConnection extends AbstractConnection {
	public constructor(protocol: ServerProtocol, logService: ConsoleLogger) {
		super(protocol, logService, 'management');

		protocol.onDidDispose(() => this.dispose('Explicitly closed'));
		protocol.onSocketClose(() => this.setOffline()); // Might reconnect.

		protocol.sendMessage({ type: 'ok' });
	}

	protected doDispose(): void {
		this.protocol.dispose();
	}

	protected doReconnect(reconnectionProtocol: ServerProtocol): void {
		reconnectionProtocol.sendMessage({ type: 'ok' });

		this.protocol.beginAcceptReconnection(reconnectionProtocol.getSocket(), reconnectionProtocol.readEntireBuffer());
		this.protocol.endAcceptReconnection();
		reconnectionProtocol.dispose();
	}
}
