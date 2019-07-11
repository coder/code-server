import * as cp from "child_process";

import { getPathFromAmdModule } from "vs/base/common/amd";
import { VSBuffer } from "vs/base/common/buffer";
import { Emitter } from "vs/base/common/event";
import { ISocket } from "vs/base/parts/ipc/common/ipc.net";
import { NodeSocket, WebSocketNodeSocket } from "vs/base/parts/ipc/node/ipc.net";
import { ILogService } from "vs/platform/log/common/log";
import { IExtHostReadyMessage, IExtHostSocketMessage } from "vs/workbench/services/extensions/common/extensionHostProtocol";

import { Protocol } from "vs/server/src/protocol";
import { uriTransformerPath } from "vs/server/src/util";

export abstract class Connection {
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;

	private timeout: NodeJS.Timeout | undefined;
	private readonly wait = 1000 * 60;

	private closed: boolean = false;

	public constructor(protected protocol: Protocol) {
		// onClose seems to mean we want to disconnect, so close immediately.
		protocol.onClose(() => this.close());

		// If the socket closes, we want to wait before closing so we can
		// reconnect in the meantime.
		protocol.onSocketClose(() => {
			this.timeout = setTimeout(() => {
				this.close();
			}, this.wait);
		});
	}

	/**
	 * Set up the connection on a new socket.
	 */
	public reconnect(protocol: Protocol, buffer: VSBuffer): void {
		if (this.closed) {
			throw new Error("Cannot reconnect to closed connection");
		}
		clearTimeout(this.timeout as any); // Not sure why the type doesn't work.
		this.protocol = protocol;
		this.connect(protocol.getSocket(), buffer);
	}

	/**
	 * Close and clean up connection. This will also kill the socket the
	 * connection is on. Probably not safe to reconnect once this has happened.
	 */
	protected close(): void {
		if (!this.closed) {
			this.closed = true;
			this.protocol.sendDisconnect();
			this.dispose();
			this.protocol.dispose();
			this._onClose.fire();
		}
	}

	/**
	 * Clean up the connection.
	 */
	protected abstract dispose(): void;

	/**
	 * Connect to a new socket.
	 */
	protected abstract connect(socket: ISocket, buffer: VSBuffer): void;
}

/**
 * Used for all the IPC channels.
 */
export class ManagementConnection extends Connection {
	protected dispose(): void {
		// Nothing extra to do here.
	}

	protected connect(socket: ISocket, buffer: VSBuffer): void {
		this.protocol.beginAcceptReconnection(socket, buffer);
		this.protocol.endAcceptReconnection();
	}
}

/**
 * Manage the extension host process.
 */
export class ExtensionHostConnection extends Connection {
	private process: cp.ChildProcess;

	public constructor(protocol: Protocol, private readonly log: ILogService) {
		super(protocol);
		const socket = this.protocol.getSocket();
		const buffer = this.protocol.readEntireBuffer();
		this.process = this.spawn(socket, buffer);
	}

	protected dispose(): void {
		this.process.kill();
	}

	protected connect(socket: ISocket, buffer: VSBuffer): void {
		this.sendInitMessage(socket, buffer);
	}

	private sendInitMessage(nodeSocket: ISocket, buffer: VSBuffer): void {
		const socket = nodeSocket instanceof NodeSocket
			? nodeSocket.socket
			: (nodeSocket as WebSocketNodeSocket).socket.socket;

		socket.pause();

		const initMessage: IExtHostSocketMessage = {
			type: "VSCODE_EXTHOST_IPC_SOCKET",
			initialDataChunk: (buffer.buffer as Buffer).toString("base64"),
			skipWebSocketFrames: nodeSocket instanceof NodeSocket,
		};

		this.process.send(initMessage, socket);
	}

	private spawn(socket: ISocket, buffer: VSBuffer): cp.ChildProcess {
		const proc = cp.fork(
			getPathFromAmdModule(require, "bootstrap-fork"),
			[
				"--type=extensionHost",
				`--uriTransformerPath=${uriTransformerPath()}`
			],
			{
				env: {
					...process.env,
					AMD_ENTRYPOINT: "vs/workbench/services/extensions/node/extensionHostProcess",
					PIPE_LOGGING: "true",
					VERBOSE_LOGGING: "true",
					VSCODE_EXTHOST_WILL_SEND_SOCKET: "true",
					VSCODE_HANDLES_UNCAUGHT_ERRORS: "true",
					VSCODE_LOG_STACK: "false",
				},
				silent: true,
			},
		);

		proc.on("error", (error) => {
			console.error(error);
			this.close();
		});

		proc.on("exit", (code, signal) => {
			console.error("Extension host exited", { code, signal });
			this.close();
		});

		proc.stdout.setEncoding("utf8");
		proc.stderr.setEncoding("utf8");
		proc.stdout.on("data", (data) => this.log.info("Extension host stdout", data));
		proc.stderr.on("data", (data) => this.log.error("Extension host stderr", data));
		proc.on("message", (event) => {
			if (event && event.type === "__$console") {
				const severity = this.log[event.severity] ? event.severity : "info";
				this.log[severity]("Extension host", event.arguments);
			}
		});

		const listen = (message: IExtHostReadyMessage) => {
			if (message.type === "VSCODE_EXTHOST_IPC_READY") {
				proc.removeListener("message", listen);
				this.sendInitMessage(socket, buffer);
			}
		};

		proc.on("message", listen);

		return proc;
	}
}
