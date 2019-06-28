import { ClientConnectionEvent } from "vs/base/parts/ipc/common/ipc";
import { ConnectionType } from "vs/platform/remote/common/remoteAgentConnection";
import { Emitter } from "vs/base/common/event";
import { PersistentProtocol, ISocket } from "vs/base/parts/ipc/common/ipc.net";
import { VSBuffer } from "vs/base/common/buffer";

export interface Server {
	readonly _onDidClientConnect: Emitter<ClientConnectionEvent>;
	readonly connections: Map<ConnectionType, Map<string, Connection>>;
}

export abstract class Connection {
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;

	private timeout: NodeJS.Timeout | undefined;
	private readonly wait = 1000 * 60 * 60;

	public constructor(
		protected readonly server: Server,
		private readonly protocol: PersistentProtocol,
	) {
		// onClose seems to mean we want to disconnect, so dispose immediately.
		this.protocol.onClose(() => this.dispose());

		// If the socket closes, we want to wait before disposing so we can
		// reconnect.
		this.protocol.onSocketClose(() => {
			this.timeout = setTimeout(() => {
				this.dispose();
			}, this.wait);
		});
	}

	/**
	 * Completely close and clean up the connection. Should only do this once we
	 * don't need or want the connection. It cannot be re-used after this.
	 */
	public dispose(): void {
		this.protocol.sendDisconnect();
		this.protocol.getSocket().end();
		this.protocol.dispose();
		this._onClose.fire();
	}

	public reconnect(socket: ISocket, buffer: VSBuffer): void {
		clearTimeout(this.timeout as any); // Not sure why the type doesn't work.
		this.protocol.beginAcceptReconnection(socket, buffer);
		this.protocol.endAcceptReconnection();
	}
}

/**
 * The management connection is used for all the IPC channels.
 */
export class ManagementConnection extends Connection {
	public constructor(server: Server, protocol: PersistentProtocol) {
		super(server, protocol);
		// This will communicate back to the IPCServer that a new client has
		// connected.
		this.server._onDidClientConnect.fire({
			protocol,
			onDidClientDisconnect: this.onClose,
		});
	}
}

export class ExtensionHostConnection extends Connection {
}
