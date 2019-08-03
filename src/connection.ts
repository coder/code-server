import * as cp from "child_process";

import { getPathFromAmdModule } from "vs/base/common/amd";
import { VSBuffer } from "vs/base/common/buffer";
import { Emitter } from "vs/base/common/event";
import { ISocket } from "vs/base/parts/ipc/common/ipc.net";
import { NodeSocket } from "vs/base/parts/ipc/node/ipc.net";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { ILogService } from "vs/platform/log/common/log";
import { IExtHostReadyMessage } from "vs/workbench/services/extensions/common/extensionHostProtocol";

import { getNlsConfiguration } from "vs/server/src/nls";
import { Protocol } from "vs/server/src/protocol";
import { uriTransformerPath } from "vs/server/src/util";

export abstract class Connection {
	protected readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;
	protected disposed: boolean = false;
	public constructor(protected protocol: Protocol) {}
	/**
	 * Set up the connection on a new socket.
	 */
	public abstract reconnect(socket: ISocket, buffer: VSBuffer): void;
	protected abstract dispose(): void;
}

/**
 * Used for all the IPC channels.
 */
export class ManagementConnection extends Connection {
	private timeout: NodeJS.Timeout | undefined;
	private readonly wait = 1000 * 60;

	public constructor(protocol: Protocol) {
		super(protocol);
		protocol.onClose(() => this.dispose());
		protocol.onSocketClose(() => {
			this.timeout = setTimeout(() => this.dispose(), this.wait);
		});
	}

	public reconnect(socket: ISocket, buffer: VSBuffer): void {
		clearTimeout(this.timeout as any); // Not sure why the type doesn't work.
		this.protocol.beginAcceptReconnection(socket, buffer);
		this.protocol.endAcceptReconnection();
	}

	protected dispose(): void {
		if (!this.disposed) {
			clearTimeout(this.timeout as any); // Not sure why the type doesn't work.
			this.disposed = true;
			this.protocol.sendDisconnect();
			this.protocol.dispose();
			this.protocol.getSocket().end();
			this._onClose.fire();
		}
	}
}

export class ExtensionHostConnection extends Connection {
	private process?: cp.ChildProcess;

	public constructor(
		locale:string, protocol: Protocol, buffer: VSBuffer,
		private readonly log: ILogService,
		private readonly environment: IEnvironmentService,
	) {
		super(protocol);
		this.protocol.dispose();
		this.spawn(locale, buffer).then((p) => this.process = p);
		this.protocol.getUnderlyingSocket().pause();
	}

	protected dispose(): void {
		if (!this.disposed) {
			this.disposed = true;
			if (this.process) {
				this.process.kill();
			}
			this.protocol.getSocket().end();
			this._onClose.fire();
		}
	}

	public reconnect(socket: ISocket, buffer: VSBuffer): void {
		// This is just to set the new socket.
		this.protocol.beginAcceptReconnection(socket, null);
		this.protocol.dispose();
		this.sendInitMessage(buffer);
	}

	private sendInitMessage(buffer: VSBuffer): void {
		const socket = this.protocol.getUnderlyingSocket();
		socket.pause();
		this.process!.send({ // Process must be set at this point.
			type: "VSCODE_EXTHOST_IPC_SOCKET",
			initialDataChunk: (buffer.buffer as Buffer).toString("base64"),
			skipWebSocketFrames: this.protocol.getSocket() instanceof NodeSocket,
		}, socket);
	}

	private async spawn(locale: string, buffer: VSBuffer): Promise<cp.ChildProcess> {
		const config = await getNlsConfiguration(locale, this.environment.userDataPath);
		const proc = cp.fork(
			getPathFromAmdModule(require, "bootstrap-fork"),
			[ "--type=extensionHost", `--uriTransformerPath=${uriTransformerPath}` ],
			{
				env: {
					...process.env,
					AMD_ENTRYPOINT: "vs/workbench/services/extensions/node/extensionHostProcess",
					PIPE_LOGGING: "true",
					VERBOSE_LOGGING: "true",
					VSCODE_EXTHOST_WILL_SEND_SOCKET: "true",
					VSCODE_HANDLES_UNCAUGHT_ERRORS: "true",
					VSCODE_LOG_STACK: "false",
					VSCODE_NLS_CONFIG: JSON.stringify(config),
				},
				silent: true,
			},
		);

		proc.on("error", () => this.dispose());
		proc.on("exit", () => this.dispose());
		proc.stdout.setEncoding("utf8").on("data", (d) => this.log.info("Extension host stdout", d));
		proc.stderr.setEncoding("utf8").on("data", (d) => this.log.error("Extension host stderr", d));
		proc.on("message", (event) => {
			if (event && event.type === "__$console") {
				const severity = this.log[event.severity] ? event.severity : "info";
				this.log[severity]("Extension host", event.arguments);
			}
		});

		const listen = (message: IExtHostReadyMessage) => {
			if (message.type === "VSCODE_EXTHOST_IPC_READY") {
				proc.removeListener("message", listen);
				this.sendInitMessage(buffer);
			}
		};

		return proc.on("message", listen);
	}
}
