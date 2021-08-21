import { FileAccess } from 'vs/base/common/network';
import { INativeEnvironmentService } from 'vs/platform/environment/common/environment';
import { DebugMessage, IRemoteExtensionHostStartParams } from 'vs/platform/remote/common/remoteAgentConnection';
import { AbstractConnection } from 'vs/server/connection/abstractConnection';
import { getNlsConfiguration } from 'vs/server/nls';
import { ServerProtocol } from 'vs/server/protocol';
import { NLSConfiguration } from 'vs/base/node/languagePacks';
import { parseExtensionDevOptions } from 'vs/workbench/services/extensions/common/extensionDevOptions';
import { findFreePort } from 'vs/base/node/ports';
import { ExtensionHost, IIPCOptions } from 'vs/base/parts/ipc/node/ipc.cp';
import { VSBuffer } from 'vs/base/common/buffer';
import { SendHandle } from 'child_process';
import { ConsoleLogger } from 'vs/platform/log/common/log';

export interface ForkEnvironmentVariables {
	VSCODE_AMD_ENTRYPOINT: string;
	/** One or the other. */
	VSCODE_EXTHOST_WILL_SEND_SOCKET: true;
	VSCODE_HANDLES_UNCAUGHT_ERRORS: boolean;
	VSCODE_LOG_LEVEL?: string;
	VSCODE_LOG_NATIVE: boolean;
	VSCODE_LOG_STACK: boolean;
	VSCODE_NLS_CONFIG: NLSConfiguration;
	VSCODE_PIPE_LOGGING: boolean;
	VSCODE_VERBOSE_LOGGING: boolean;
	VSCODE_CODE_CACHE_PATH?: string;
}

/**
 * This complements the client-side `PersistantConnection` in `RemoteExtensionHost`.
 */
export class ExtensionHostConnection extends AbstractConnection {
	private clientProcess?: ExtensionHost;

	/** @TODO Document usage. */
	public readonly _isExtensionDevHost: boolean;
	public readonly _isExtensionDevDebug: boolean;
	public readonly _isExtensionDevTestFromCli: boolean;

	public constructor(protocol: ServerProtocol, logService: ConsoleLogger, private readonly startParams: IRemoteExtensionHostStartParams, private readonly _environmentService: INativeEnvironmentService) {
		super(protocol, logService, 'ExtensionHost');

		const devOpts = parseExtensionDevOptions(this._environmentService);
		this._isExtensionDevHost = devOpts.isExtensionDevHost;
		this._isExtensionDevDebug = devOpts.isExtensionDevDebug;
		this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
	}

	private get debugMessage(): DebugMessage {
		return {
			type: 'debug',
			debugPort: typeof this.startParams.port === 'number' ? this.startParams.port : undefined,
		};
	}

	/**
	 * Find a free port if extension host debugging is enabled.
	 */
	private async _tryFindDebugPort(): Promise<number> {
		if (typeof this._environmentService.debugExtensionHost.port !== 'number') {
			return 0;
		}

		const expected = this.startParams.port || this._environmentService.debugExtensionHost.port;
		const port = await findFreePort(expected, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */);

		if (!this._isExtensionDevTestFromCli) {
			if (!port) {
				console.warn('%c[Extension Host] %cCould not find a free port for debugging', 'color: blue', 'color:');
			} else {
				if (port !== expected) {
					console.warn(`%c[Extension Host] %cProvided debugging port ${expected} is not free, using ${port} instead.`, 'color: blue', 'color:');
				}
			}
		}

		return port || 0;
	}

	protected doDispose(): void {
		this.protocol.dispose();

		this.clientProcess?.dispose();
	}

	protected doReconnect(reconnectionProtocol: ServerProtocol): void {
		this.logService.debug(this.logPrefix, '(Reconnect 1/4)', 'Sending new protocol debug message...');
		reconnectionProtocol.sendMessage(this.debugMessage);

		this.logService.debug(this.logPrefix, '(Reconnect 2/4)', 'Swapping socket references...');

		this.protocol.beginAcceptReconnection(reconnectionProtocol.getSocket(), reconnectionProtocol.readEntireBuffer());
		this.protocol.endAcceptReconnection();

		this.logService.debug(this.logPrefix, '(Reconnect 3/4)', 'Pausing socket until we have a chance to forward its data.');
		const { initialDataChunk, sendHandle } = this.protocol.suspend();

		const messageSent = this.sendInitMessage(initialDataChunk, this.protocol.inflateBytes, sendHandle);

		if (!messageSent) {
			new Error('Child process did not receive init message. Is their a backlog?');
		}

		this.logService.debug(this.logPrefix, '(Reconnect 4/4)', 'Child process received init message!');
	}

	/**
	 * Sends IPC socket to client process.
	 * @remark This is the complement of `extensionHostProcessSetup.ts#_createExtHostProtocol`
	 */
	private sendInitMessage(initialDataChunk: VSBuffer, inflateBytes: VSBuffer, sendHandle: SendHandle): boolean {
		if (!this.clientProcess) {
			throw new Error(`${this.logPrefix} Client process is not set`);
		}

		this.logService.debug(this.logPrefix, 'Sending init message to client process...');

		return this.clientProcess.sendIPCMessage(
			{
				type: 'VSCODE_EXTHOST_IPC_SOCKET',
				initialDataChunk: Buffer.from(initialDataChunk.buffer).toString('base64'),
				skipWebSocketFrames: this.protocol.skipWebSocketFrames,
				permessageDeflate: this.protocol.getSocket().permessageDeflate,
				inflateBytes: inflateBytes ? Buffer.from(inflateBytes.buffer).toString('base64') : '',
			},
			sendHandle,
		);
	}

	private async generateClientOptions(): Promise<IIPCOptions> {
		this.logService.debug('Getting NLS configuration...');
		const config = await getNlsConfiguration(this.startParams.language, this._environmentService.userDataPath);
		const portNumber = await this._tryFindDebugPort();

		return {
			serverName: 'Server Extension Host',
			freshExecArgv: true,
			debugBrk: this.startParams.break ? portNumber : undefined,
			debug: this.startParams.break ? undefined : portNumber,
			args: ['--type=extensionHost', '--skipWorkspaceStorageLock'],
			env: <ForkEnvironmentVariables>{
				VSCODE_AMD_ENTRYPOINT: 'vs/workbench/services/extensions/node/extensionHostProcess',
				VSCODE_PIPE_LOGGING: true,
				VSCODE_VERBOSE_LOGGING: true,
				/** Extension child process will wait until socket is sent. */
				VSCODE_EXTHOST_WILL_SEND_SOCKET: true,
				VSCODE_HANDLES_UNCAUGHT_ERRORS: true,
				VSCODE_LOG_STACK: false,
				VSCODE_LOG_LEVEL: this._environmentService.verbose ? 'trace' : this._environmentService.logLevel || process.env.LOG_LEVEL,
				VSCODE_NLS_CONFIG: config,
				VSCODE_LOG_NATIVE: this._isExtensionDevHost,
				// Unset `VSCODE_CODE_CACHE_PATH` when developing extensions because it might
				// be that dependencies, that otherwise would be cached, get modified.
				VSCODE_CODE_CACHE_PATH: this._isExtensionDevHost ? undefined : process.env['VSCODE_CODE_CACHE_PATH'],
			},
		};
	}

	/**
	 * Creates an extension host child process.
	 * @remark this is very similar to `LocalProcessExtensionHost`
	 */
	public spawn(): Promise<void> {
		return new Promise(async (resolve, reject) => {
			this.logService.debug(this.logPrefix, '(Spawn 1/7)', 'Sending client initial debug message.');
			this.protocol.sendMessage(this.debugMessage);

			this.logService.debug(this.logPrefix, '(Spawn 2/7)', 'Pausing socket until we have a chance to forward its data.');

			const { initialDataChunk, sendHandle } = this.protocol.suspend();

			this.logService.debug(this.logPrefix, '(Spawn 3/7)', 'Generating IPC client options...');
			const clientOptions = await this.generateClientOptions();

			this.logService.debug(this.logPrefix, '(Spawn 4/7)', 'Starting extension host child process...');
			this.clientProcess = new ExtensionHost(FileAccess.asFileUri('bootstrap-fork', require).fsPath, clientOptions);

			this.clientProcess.onDidProcessExit(({ code, signal }) => {
				this.dispose();

				if (code !== 0 && signal !== 'SIGTERM') {
					this.logService.error(`${this.logPrefix} Extension host exited with code: ${code} and signal: ${signal}.`);
				}
			});

			this.clientProcess.onReady(() => {
				this.logService.debug(this.logPrefix, '(Spawn 5/7)', 'Extension host is ready!');
				this.logService.debug(this.logPrefix, '(Spawn 6/7)', 'Sending init message to child process...');
				const messageSent = this.sendInitMessage(initialDataChunk, this.protocol.inflateBytes, sendHandle);

				if (messageSent) {
					this.logService.debug(this.logPrefix, '(Spawn 7/7)', 'Child process received init message!');
					return resolve();
				}

				reject(new Error('Child process did not receive init message. Is their a backlog?'));
			});
		});
	}
}
