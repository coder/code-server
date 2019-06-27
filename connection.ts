import { Emitter } from "vs/base/common/event";
import { PersistentProtocol, ISocket } from "vs/base/parts/ipc/common/ipc.net";
import { VSBuffer } from "vs/base/common/buffer";

export abstract class Connection {
	protected readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;

	public constructor(private readonly protocol: PersistentProtocol) {
		this.protocol.onSocketClose(() => {
			// TODO: eventually we'll want to clean up the connection if nothing
			// ever connects back to it
		});
	}

	public reconnect(socket: ISocket, buffer: VSBuffer): void {
		this.protocol.beginAcceptReconnection(socket, buffer);
		this.protocol.endAcceptReconnection();
	}
}

export class ManagementConnection extends Connection {
	// in here they accept the connection
	// to the ipc of the RemoteServer
}

export class ExtensionHostConnection extends Connection {
}
