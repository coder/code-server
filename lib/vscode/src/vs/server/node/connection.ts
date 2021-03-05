import { field, Logger, logger } from '@coder/logger';
import * as cp from 'child_process';
import { VSBuffer } from 'vs/base/common/buffer';
import { Emitter } from 'vs/base/common/event';
import { FileAccess } from 'vs/base/common/network';
import { ISocket } from 'vs/base/parts/ipc/common/ipc.net';
import { WebSocketNodeSocket } from 'vs/base/parts/ipc/node/ipc.net';
import { INativeEnvironmentService } from 'vs/platform/environment/common/environment';
import { getNlsConfiguration } from 'vs/server/node/nls';
import { Protocol } from 'vs/server/node/protocol';
import { IExtHostReadyMessage } from 'vs/workbench/services/extensions/common/extensionHostProtocol';

export abstract class Connection {
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;
	private disposed = false;
	private _offline: number | undefined;

	public constructor(protected protocol: Protocol, public readonly token: string) {}

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

	protected setOffline(): void {
		if (!this._offline) {
			this._offline = Date.now();
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
	public constructor(protected protocol: Protocol, token: string) {
		super(protocol, token);
		protocol.onDidDispose(() => this.dispose()); // Explicit close.
		protocol.onSocketClose(() => this.setOffline()); // Might reconnect.
	}

	protected doDispose(): void {
		this.protocol.sendDisconnect();
		this.protocol.dispose();
		this.protocol.getUnderlyingSocket().destroy();
	}

	protected doReconnect(socket: ISocket, buffer: VSBuffer): void {
		this.protocol.beginAcceptReconnection(socket, buffer);
		this.protocol.endAcceptReconnection();
	}
}

interface DisconnectedMessage {
	type: 'VSCODE_EXTHOST_DISCONNECTED';
}

interface ConsoleMessage {
	type: '__$console';
	// See bootstrap-fork.js#L135.
	severity: 'log' | 'warn' | 'error';
	arguments: any[];
}

type ExtHostMessage = DisconnectedMessage | ConsoleMessage | IExtHostReadyMessage;

export class ExtensionHostConnection extends Connection {
	private process?: cp.ChildProcess;
	private readonly logger: Logger;

	public constructor(
		locale: string, protocol: Protocol, buffer: VSBuffer, token: string,
		private readonly environment: INativeEnvironmentService,
	) {
		super(protocol, token);
		this.logger = logger.named('exthost', field('token', token));
		this.protocol.dispose();
		this.spawn(locale, buffer).then((p) => this.process = p);
		this.protocol.getUnderlyingSocket().pause();
	}

	protected doDispose(): void {
		if (this.process) {
			this.process.kill();
		}
		this.protocol.getUnderlyingSocket().destroy();
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

		const wrapperSocket = this.protocol.getSocket();

		this.logger.trace('Sending socket');
		this.process!.send({ // Process must be set at this point.
			type: 'VSCODE_EXTHOST_IPC_SOCKET',
			initialDataChunk: Buffer.from(buffer.buffer).toString('base64'),
			skipWebSocketFrames: !(wrapperSocket instanceof WebSocketNodeSocket),
			permessageDeflate: this.protocol.options.permessageDeflate,
			inflateBytes: wrapperSocket instanceof WebSocketNodeSocket
				? Buffer.from(wrapperSocket.recordedInflateBytes.buffer).toString('base64')
				: undefined,
		}, socket);
	}

	private async spawn(locale: string, buffer: VSBuffer): Promise<cp.ChildProcess> {
		this.logger.trace('Getting NLS configuration...');
		const config = await getNlsConfiguration(locale, this.environment.userDataPath);
		this.logger.trace('Spawning extension host...');
		const proc = cp.fork(
			FileAccess.asFileUri('bootstrap-fork', require).fsPath,
			// While not technically necessary, makes it easier to tell which process
			// bootstrap-fork is executing. Can also do pkill -f extensionHost
			// Other spawns in the VS Code codebase behave similarly.
			[ '--type=extensionHost' ],
			{
				env: {
					...process.env,
					VSCODE_AMD_ENTRYPOINT: 'vs/workbench/services/extensions/node/extensionHostProcess',
					VSCODE_PIPE_LOGGING: 'true',
					VSCODE_VERBOSE_LOGGING: 'true',
					VSCODE_EXTHOST_WILL_SEND_SOCKET: 'true',
					VSCODE_HANDLES_UNCAUGHT_ERRORS: 'true',
					VSCODE_LOG_STACK: 'false',
					VSCODE_LOG_LEVEL: process.env.LOG_LEVEL,
					VSCODE_NLS_CONFIG: JSON.stringify(config),
					VSCODE_PARENT_PID: String(process.pid),
				},
				silent: true,
			},
		);

		proc.on('error', (error) => {
			this.logger.error('Exited unexpectedly', field('error', error));
			this.dispose();
		});
		proc.on('exit', (code) => {
			this.logger.trace('Exited', field('code', code));
			this.dispose();
		});
		if (proc.stdout && proc.stderr) {
			proc.stdout.setEncoding('utf8').on('data', (d) => this.logger.info(d));
			proc.stderr.setEncoding('utf8').on('data', (d) => this.logger.error(d));
		}

		proc.on('message', (event: ExtHostMessage) => {
			switch (event.type) {
				case '__$console':
					const fn = this.logger[event.severity === 'log' ? 'info' : event.severity];
					if (fn) {
						fn.bind(this.logger)('console', field('arguments', event.arguments));
					} else {
						this.logger.error('Unexpected severity', field('event', event));
					}
					break;
				case 'VSCODE_EXTHOST_DISCONNECTED':
					this.logger.trace('Going offline');
					this.setOffline();
					break;
				case 'VSCODE_EXTHOST_IPC_READY':
					this.logger.trace('Got ready message');
					this.sendInitMessage(buffer);
					break;
				default:
					this.logger.error('Unexpected message', field('event', event));
					break;
			}
		});

		this.logger.trace('Waiting for handshake...');
		return proc;
	}
}
