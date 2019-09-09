import * as cp from "child_process";
import { getPathFromAmdModule } from "vs/base/common/amd";
import { VSBuffer } from "vs/base/common/buffer";
import { Emitter } from "vs/base/common/event";
import { ISocket } from "vs/base/parts/ipc/common/ipc.net";
import { NodeSocket } from "vs/base/parts/ipc/node/ipc.net";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { ILogService } from "vs/platform/log/common/log";
import { getNlsConfiguration } from "vs/server/src/nls";
import { Protocol } from "vs/server/src/protocol";
import { uriTransformerPath } from "vs/server/src/util";
import { IExtHostReadyMessage } from "vs/workbench/services/extensions/common/extensionHostProtocol";

export abstract class Connection {
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;
	private disposed = false;
	private _offline: number | undefined;

	public constructor(protected protocol: Protocol) {
		protocol.onClose(() => this.dispose()); // Explicit close.
		protocol.onSocketClose(() => this._offline = Date.now()); // Might reconnect.
	}

	public get offline(): number | undefined {
		return this._offline;
	}

	public reconnect(socket: ISocket, buffer: VSBuffer): void {
		this._offline = undefined;
		this.doReconnect(socket, buffer);
	}

	public dispose(): void {
		if (!this.disposed) {
			this.disposed = true;
			this.doDispose();
			this._onClose.fire();
		}
	}

	/**
	 * Set up the connection on a new socket.
	 */
	protected abstract doReconnect(socket: ISocket, buffer: VSBuffer): void;
	protected abstract doDispose(): void;
}

/**
 * Used for all the IPC channels.
 */
export class ManagementConnection extends Connection {
	protected doDispose(): void {
		this.protocol.sendDisconnect();
		this.protocol.dispose();
		this.protocol.getSocket().end();
	}

	protected doReconnect(socket: ISocket, buffer: VSBuffer): void {
		this.protocol.beginAcceptReconnection(socket, buffer);
		this.protocol.endAcceptReconnection();
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

	protected doDispose(): void {
		if (this.process) {
			this.process.kill();
		}
		this.protocol.getSocket().end();
	}

	protected doReconnect(socket: ISocket, buffer: VSBuffer): void {
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
				const severity = (<any>this.log)[event.severity] ? event.severity : "info";
				(<any>this.log)[severity]("Extension host", event.arguments);
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
