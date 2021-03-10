import { field, logger } from '@coder/logger';
import * as os from 'os';
import * as path from 'path';
import { VSBuffer } from 'vs/base/common/buffer';
import { CancellationTokenSource } from 'vs/base/common/cancellation';
import { Emitter, Event } from 'vs/base/common/event';
import { IDisposable } from 'vs/base/common/lifecycle';
import * as platform from 'vs/base/common/platform';
import * as resources from 'vs/base/common/resources';
import { ReadableStreamEventPayload } from 'vs/base/common/stream';
import { URI, UriComponents } from 'vs/base/common/uri';
import { transformOutgoingURIs } from 'vs/base/common/uriIpc';
import { getSystemShell } from 'vs/base/node/shell';
import { IServerChannel } from 'vs/base/parts/ipc/common/ipc';
import { IDiagnosticInfo } from 'vs/platform/diagnostics/common/diagnostics';
import { INativeEnvironmentService } from 'vs/platform/environment/common/environment';
import { ExtensionIdentifier, IExtensionDescription } from 'vs/platform/extensions/common/extensions';
import { FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileReadStreamOptions, FileType, FileWriteOptions, IStat, IWatchOptions } from 'vs/platform/files/common/files';
import { DiskFileSystemProvider } from 'vs/platform/files/node/diskFileSystemProvider';
import { ILogService } from 'vs/platform/log/common/log';
import product from 'vs/platform/product/common/product';
import { IRemoteAgentEnvironment, RemoteAgentConnectionContext } from 'vs/platform/remote/common/remoteAgentEnvironment';
import { ITelemetryData, ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { getTranslations } from 'vs/server/node/nls';
import { getUriTransformer } from 'vs/server/node/util';
import { IFileChangeDto } from 'vs/workbench/api/common/extHost.protocol';
import { IEnvironmentVariableCollection } from 'vs/workbench/contrib/terminal/common/environmentVariable';
import { MergedEnvironmentVariableCollection } from 'vs/workbench/contrib/terminal/common/environmentVariableCollection';
import { deserializeEnvironmentVariableCollection } from 'vs/workbench/contrib/terminal/common/environmentVariableShared';
import * as terminal from 'vs/workbench/contrib/terminal/common/remoteTerminalChannel';
import { IShellLaunchConfig, ITerminalEnvironment, ITerminalLaunchError, ITerminalsLayoutInfo } from 'vs/workbench/contrib/terminal/common/terminal';
import { TerminalDataBufferer } from 'vs/workbench/contrib/terminal/common/terminalDataBuffering';
import * as terminalEnvironment from 'vs/workbench/contrib/terminal/common/terminalEnvironment';
import { getMainProcessParentEnv } from 'vs/workbench/contrib/terminal/node/terminalEnvironment';
import { TerminalProcess } from 'vs/workbench/contrib/terminal/node/terminalProcess';
import { AbstractVariableResolverService } from 'vs/workbench/services/configurationResolver/common/variableResolver';
import { ExtensionScanner, ExtensionScannerInput } from 'vs/workbench/services/extensions/node/extensionPoints';

/**
 * Extend the file provider to allow unwatching.
 */
class Watcher extends DiskFileSystemProvider {
	public readonly watches = new Map<number, IDisposable>();

	public dispose(): void {
		this.watches.forEach((w) => w.dispose());
		this.watches.clear();
		super.dispose();
	}

	public _watch(req: number, resource: URI, opts: IWatchOptions): void {
		this.watches.set(req, this.watch(resource, opts));
	}

	public unwatch(req: number): void {
		this.watches.get(req)!.dispose();
		this.watches.delete(req);
	}
}

export class FileProviderChannel implements IServerChannel<RemoteAgentConnectionContext>, IDisposable {
	private readonly provider: DiskFileSystemProvider;
	private readonly watchers = new Map<string, Watcher>();

	public constructor(
		private readonly environmentService: INativeEnvironmentService,
		private readonly logService: ILogService,
	) {
		this.provider = new DiskFileSystemProvider(this.logService);
	}

	public listen(context: RemoteAgentConnectionContext, event: string, args?: any): Event<any> {
		switch (event) {
			case 'filechange': return this.filechange(context, args[0]);
			case 'readFileStream': return this.readFileStream(args[0], args[1]);
		}

		throw new Error(`Invalid listen '${event}'`);
	}

	private filechange(context: RemoteAgentConnectionContext, session: string): Event<IFileChangeDto[]> {
		const emitter = new Emitter<IFileChangeDto[]>({
			onFirstListenerAdd: () => {
				const provider = new Watcher(this.logService);
				this.watchers.set(session, provider);
				const transformer = getUriTransformer(context.remoteAuthority);
				provider.onDidChangeFile((events) => {
					emitter.fire(events.map((event) => ({
						...event,
						resource: transformer.transformOutgoing(event.resource),
					})));
				});
				provider.onDidErrorOccur((event) => this.logService.error(event));
			},
			onLastListenerRemove: () => {
				this.watchers.get(session)!.dispose();
				this.watchers.delete(session);
			},
		});

		return emitter.event;
	}

	private readFileStream(resource: UriComponents, opts: FileReadStreamOptions): Event<ReadableStreamEventPayload<VSBuffer>> {
		const cts = new CancellationTokenSource();
		const fileStream = this.provider.readFileStream(this.transform(resource), opts, cts.token);
		const emitter = new Emitter<ReadableStreamEventPayload<VSBuffer>>({
			onFirstListenerAdd: () => {
				fileStream.on('data', (data) => emitter.fire(VSBuffer.wrap(data)));
				fileStream.on('error', (error) => emitter.fire(error));
				fileStream.on('end', () => emitter.fire('end'));
			},
			onLastListenerRemove: () => cts.cancel(),
		});

		return emitter.event;
	}

	public call(_: unknown, command: string, args?: any): Promise<any> {
		switch (command) {
			case 'stat': return this.stat(args[0]);
			case 'open': return this.open(args[0], args[1]);
			case 'close': return this.close(args[0]);
			case 'read': return this.read(args[0], args[1], args[2]);
			case 'readFile': return this.readFile(args[0]);
			case 'write': return this.write(args[0], args[1], args[2], args[3], args[4]);
			case 'writeFile': return this.writeFile(args[0], args[1], args[2]);
			case 'delete': return this.delete(args[0], args[1]);
			case 'mkdir': return this.mkdir(args[0]);
			case 'readdir': return this.readdir(args[0]);
			case 'rename': return this.rename(args[0], args[1], args[2]);
			case 'copy': return this.copy(args[0], args[1], args[2]);
			case 'watch': return this.watch(args[0], args[1], args[2], args[3]);
			case 'unwatch': return this.unwatch(args[0], args[1]);
		}

		throw new Error(`Invalid call '${command}'`);
	}

	public dispose(): void {
		this.watchers.forEach((w) => w.dispose());
		this.watchers.clear();
	}

	private async stat(resource: UriComponents): Promise<IStat> {
		return this.provider.stat(this.transform(resource));
	}

	private async open(resource: UriComponents, opts: FileOpenOptions): Promise<number> {
		return this.provider.open(this.transform(resource), opts);
	}

	private async close(fd: number): Promise<void> {
		return this.provider.close(fd);
	}

	private async read(fd: number, pos: number, length: number): Promise<[VSBuffer, number]> {
		const buffer = VSBuffer.alloc(length);
		const bytesRead = await this.provider.read(fd, pos, buffer.buffer, 0, length);
		return [buffer, bytesRead];
	}

	private async readFile(resource: UriComponents): Promise<VSBuffer> {
		return VSBuffer.wrap(await this.provider.readFile(this.transform(resource)));
	}

	private write(fd: number, pos: number, buffer: VSBuffer, offset: number, length: number): Promise<number> {
		return this.provider.write(fd, pos, buffer.buffer, offset, length);
	}

	private writeFile(resource: UriComponents, buffer: VSBuffer, opts: FileWriteOptions): Promise<void> {
		return this.provider.writeFile(this.transform(resource), buffer.buffer, opts);
	}

	private async delete(resource: UriComponents, opts: FileDeleteOptions): Promise<void> {
		return this.provider.delete(this.transform(resource), opts);
	}

	private async mkdir(resource: UriComponents): Promise<void> {
		return this.provider.mkdir(this.transform(resource));
	}

	private async readdir(resource: UriComponents): Promise<[string, FileType][]> {
		return this.provider.readdir(this.transform(resource));
	}

	private async rename(resource: UriComponents, target: UriComponents, opts: FileOverwriteOptions): Promise<void> {
		return this.provider.rename(this.transform(resource), URI.from(target), opts);
	}

	private copy(resource: UriComponents, target: UriComponents, opts: FileOverwriteOptions): Promise<void> {
		return this.provider.copy(this.transform(resource), URI.from(target), opts);
	}

	private async watch(session: string, req: number, resource: UriComponents, opts: IWatchOptions): Promise<void> {
		this.watchers.get(session)!._watch(req, this.transform(resource), opts);
	}

	private async unwatch(session: string, req: number): Promise<void> {
		this.watchers.get(session)!.unwatch(req);
	}

	private transform(resource: UriComponents): URI {
		// Used for walkthrough content.
		if (/^\/static[^/]*\//.test(resource.path)) {
			return URI.file(this.environmentService.appRoot + resource.path.replace(/^\/static[^/]*\//, '/'));
		// Used by the webview service worker to load resources.
		} else if (resource.path === '/vscode-resource' && resource.query) {
			try {
				const query = JSON.parse(resource.query);
				if (query.requestResourcePath) {
					return URI.file(query.requestResourcePath);
				}
			} catch (error) { /* Carry on. */ }
		}
		return URI.from(resource);
	}
}

// See ../../workbench/services/remote/common/remoteAgentEnvironmentChannel.ts
export class ExtensionEnvironmentChannel implements IServerChannel {
	public constructor(
		private readonly environment: INativeEnvironmentService,
		private readonly log: ILogService,
		private readonly telemetry: ITelemetryService,
		private readonly connectionToken: string,
	) {}

	public listen(_: unknown, event: string): Event<any> {
		throw new Error(`Invalid listen '${event}'`);
	}

	public async call(context: any, command: string, args: any): Promise<any> {
		switch (command) {
			case 'getEnvironmentData':
				return transformOutgoingURIs(
					await this.getEnvironmentData(),
					getUriTransformer(context.remoteAuthority),
				);
			case 'scanExtensions':
				return transformOutgoingURIs(
					await this.scanExtensions(args.language),
					getUriTransformer(context.remoteAuthority),
				);
			case 'getDiagnosticInfo': return this.getDiagnosticInfo();
			case 'disableTelemetry': return this.disableTelemetry();
			case 'logTelemetry': return this.logTelemetry(args[0], args[1]);
			case 'flushTelemetry': return this.flushTelemetry();
		}
		throw new Error(`Invalid call '${command}'`);
	}

	private async getEnvironmentData(): Promise<IRemoteAgentEnvironment> {
		return {
			pid: process.pid,
			connectionToken: this.connectionToken,
			appRoot: URI.file(this.environment.appRoot),
			settingsPath: this.environment.settingsResource,
			logsPath: URI.file(this.environment.logsPath),
			extensionsPath: URI.file(this.environment.extensionsPath!),
			extensionHostLogsPath: URI.file(path.join(this.environment.logsPath, 'extension-host')),
			globalStorageHome: this.environment.globalStorageHome,
			workspaceStorageHome: this.environment.workspaceStorageHome,
			userHome: this.environment.userHome,
			os: platform.OS,
			marks: []
		};
	}

	private async scanExtensions(language: string): Promise<IExtensionDescription[]> {
		const translations = await getTranslations(language, this.environment.userDataPath);

		const scanMultiple = (isBuiltin: boolean, isUnderDevelopment: boolean, paths: string[]): Promise<IExtensionDescription[][]> => {
			return Promise.all(paths.map((path) => {
				return ExtensionScanner.scanExtensions(new ExtensionScannerInput(
					product.version,
					product.commit,
					language,
					!!process.env.VSCODE_DEV,
					path,
					isBuiltin,
					isUnderDevelopment,
					translations,
				), this.log);
			}));
		};

		const scanBuiltin = async (): Promise<IExtensionDescription[][]> => {
			return scanMultiple(true, false, [this.environment.builtinExtensionsPath, ...this.environment.extraBuiltinExtensionPaths]);
		};

		const scanInstalled = async (): Promise<IExtensionDescription[][]> => {
			return scanMultiple(false, true, [this.environment.extensionsPath!, ...this.environment.extraExtensionPaths]);
		};

		return Promise.all([scanBuiltin(), scanInstalled()]).then((allExtensions) => {
			const uniqueExtensions = new Map<string, IExtensionDescription>();
			allExtensions.forEach((multipleExtensions) => {
				multipleExtensions.forEach((extensions) => {
					extensions.forEach((extension) => {
						const id = ExtensionIdentifier.toKey(extension.identifier);
						if (uniqueExtensions.has(id)) {
							const oldPath = uniqueExtensions.get(id)!.extensionLocation.fsPath;
							const newPath = extension.extensionLocation.fsPath;
							this.log.warn(`${oldPath} has been overridden ${newPath}`);
						}
						uniqueExtensions.set(id, extension);
					});
				});
			});
			return Array.from(uniqueExtensions.values());
		});
	}

	private getDiagnosticInfo(): Promise<IDiagnosticInfo> {
		throw new Error('not implemented');
	}

	private async disableTelemetry(): Promise<void> {
		this.telemetry.setEnabled(false);
	}

	private async logTelemetry(eventName: string, data: ITelemetryData): Promise<void> {
		this.telemetry.publicLog(eventName, data);
	}

	private async flushTelemetry(): Promise<void> {
		// We always send immediately at the moment.
	}
}

class VariableResolverService extends AbstractVariableResolverService {
	constructor(
		remoteAuthority: string,
		args: terminal.ICreateTerminalProcessArguments,
		env: platform.IProcessEnvironment,
	) {
		super({
			getFolderUri: (name: string): URI | undefined => {
				const folder = args.workspaceFolders.find((f) => f.name === name);
				return folder && URI.revive(folder.uri);
			},
			getWorkspaceFolderCount: (): number => {
				return args.workspaceFolders.length;
			},
			// In ../../workbench/contrib/terminal/common/remoteTerminalChannel.ts it
			// looks like there are `config:` entries which must be for this? Not sure
			// how/if the URI comes into play though.
			getConfigurationValue: (_: URI, section: string): string | undefined => {
				return args.resolvedVariables[`config:${section}`];
			},
			getExecPath: (): string | undefined => {
				// Assuming that resolverEnv is just for use in the resolver and not for
				// the terminal itself.
				return (args.resolverEnv && args.resolverEnv['VSCODE_EXEC_PATH']) || env['VSCODE_EXEC_PATH'];
			},
			// This is just a guess; this is the only file-related thing we're sent
			// and none of these resolver methods seem to get called so I don't know
			// how to test.
			getFilePath: (): string | undefined => {
				const resource = transformIncoming(remoteAuthority, args.activeFileResource);
				if (!resource) {
					return undefined;
				}
				// See ../../editor/standalone/browser/simpleServices.ts;
				// `BaseConfigurationResolverService` calls `getUriLabel` from there.
				if (resource.scheme === 'file') {
					return resource.fsPath;
				}
				return resource.path;
			},
			// It looks like these are set here although they aren't on the types:
			// ../../workbench/contrib/terminal/common/remoteTerminalChannel.ts
			getSelectedText: (): string | undefined => {
				return args.resolvedVariables.selectedText;
			},
			getLineNumber: (): string | undefined => {
				return args.resolvedVariables.selectedText;
			},
		}, undefined, env);
	}
}

class Terminal {
	private readonly process: TerminalProcess;
	private _pid: number = -1;
	private _title: string = '';
	public readonly workspaceId: string;
	public readonly workspaceName: string;
	private readonly persist: boolean;

	private readonly _onDispose = new Emitter<void>();
	public get onDispose(): Event<void> { return this._onDispose.event; }

	private _isOrphan = true;
	public get isOrphan(): boolean { return this._isOrphan; }

	// These are replayed when a client reconnects.
	private cols: number;
	private rows: number;
	private replayData: string[] = [];
	// This is based on string length and is pretty arbitrary.
	private readonly maxReplayData = 10000;
	private totalReplayData = 0;

	// According to the release notes the terminals are supposed to dispose after
	// a short timeout; in our case we'll use 48 hours so you can get them back
	// the next day or over the weekend.
	private disposeTimeout: NodeJS.Timeout | undefined;
	private disposeDelay = 48 * 60 * 60 * 1000;

	private buffering = false;
	private readonly _onEvent = new Emitter<terminal.IRemoteTerminalProcessEvent>({
		// Don't bind to data until something is listening.
		onFirstListenerAdd: () => {
			logger.debug('Terminal bound', field('id', this.id));
			this._isOrphan = false;
			if (!this.buffering) {
				this.buffering = true;
				this.bufferer.startBuffering(this.id, this.process.onProcessData);
			}
		},

		// Replay stored events.
		onFirstListenerDidAdd: () => {
			// We only need to replay if the terminal is being reconnected which is
			// true if there is a dispose timeout.
			if (typeof this.disposeTimeout !== 'undefined') {
				return;
			}

			clearTimeout(this.disposeTimeout);
			this.disposeTimeout = undefined;

			logger.debug('Terminal replaying', field('id', this.id));
			this._onEvent.fire({
				type: 'replay',
				events: [{
					cols: this.cols,
					rows: this.rows,
					data: this.replayData.join(''),
				}]
			});
		},

		onLastListenerRemove: () => {
			logger.debug('Terminal unbound', field('id', this.id));
			this._isOrphan = true;
			if (!this.persist) { // Used by debug consoles.
				this.dispose();
			} else {
				this.disposeTimeout = setTimeout(() => {
					this.dispose();
				}, this.disposeDelay);
			}
		}
	});

	public get onEvent(): Event<terminal.IRemoteTerminalProcessEvent> { return this._onEvent.event; }

	// Buffer to reduce the number of messages going to the renderer.
	private readonly bufferer = new TerminalDataBufferer((_, data) => {
		this._onEvent.fire({
			type: 'data',
			data,
		});

		// No need to store data if we aren't persisting.
		if (!this.persist) {
			return;
		}

		this.replayData.push(data);
		this.totalReplayData += data.length;

		let overflow = this.totalReplayData - this.maxReplayData;
		if (overflow <= 0) {
			return;
		}

		// Drop events until doing so would put us under budget.
		let deleteCount = 0;
		for (; deleteCount < this.replayData.length
			&& this.replayData[deleteCount].length <= overflow; ++deleteCount) {
			overflow -= this.replayData[deleteCount].length;
		}

		if (deleteCount > 0) {
			this.replayData.splice(0, deleteCount);
		}

		// Dropping any more events would put us under budget; trim the first event
		// instead if still over budget.
		if (overflow > 0 && this.replayData.length > 0) {
			this.replayData[0] = this.replayData[0].substring(overflow);
		}

		this.totalReplayData = this.replayData.reduce((p, c) => p + c.length, 0);
	});

	public get pid(): number {
		return this._pid;
	}

	public get title(): string {
		return this._title;
	}

	public constructor(
		public readonly id: number,
		config: IShellLaunchConfig & { cwd: string },
		args: terminal.ICreateTerminalProcessArguments,
		env: platform.IProcessEnvironment,
		logService: ILogService,
	) {
		this.workspaceId = args.workspaceId;
		this.workspaceName = args.workspaceName;

		this.cols = args.cols;
		this.rows = args.rows;

		// TODO: Don't persist terminals until we make it work with things like
		// htop, vim, etc.
		// this.persist = args.shouldPersistTerminal;
		this.persist = false;

		this.process = new TerminalProcess(
			config,
			config.cwd,
			this.cols,
			this.rows,
			env,
			process.env as platform.IProcessEnvironment, // Environment used for `findExecutable`.
			false, // windowsEnableConpty: boolean,
			logService,
		);

		// The current pid and title aren't exposed so they have to be tracked.
		this.process.onProcessReady((event) => {
			this._pid = event.pid;
			this._onEvent.fire({
				type: 'ready',
				pid: event.pid,
				cwd: event.cwd,
			});
		});

		this.process.onProcessTitleChanged((title) => {
			this._title = title;
			this._onEvent.fire({
				type: 'titleChanged',
				title,
			});
		});

		this.process.onProcessExit((exitCode) => {
			logger.debug('Terminal exited', field('id', this.id), field('code', exitCode));
			this._onEvent.fire({
				type: 'exit',
				exitCode,
			});
			this.dispose();
		});

		// TODO: I think `execCommand` must have something to do with running
		// commands on the terminal that will do things in VS Code but we already
		// have that functionality via a socket so I'm not sure what this is for.
		// type: 'execCommand';
		// reqId: number;
		// commandId: string;
		// commandArgs: any[];

		// TODO: Maybe this is to ask if the terminal is currently attached to
		// anything? But we already know that on account of whether anything is
		// listening to our event emitter.
		// type: 'orphan?';
	}

	public async dispose() {
		logger.debug('Terminal disposing', field('id', this.id));
		this._onEvent.dispose();
		this.bufferer.dispose();
		await this.process.shutdown(true);
		this.process.dispose();
		this._onDispose.fire();
		this._onDispose.dispose();
	}

	public shutdown(immediate: boolean): Promise<void> {
		return this.process.shutdown(immediate);
	}

	public getCwd(): Promise<string> {
		return this.process.getCwd();
	}

	public getInitialCwd(): Promise<string> {
		return this.process.getInitialCwd();
	}

	public start(): Promise<ITerminalLaunchError | undefined> {
		return this.process.start();
	}

	public input(data: string): void {
		return this.process.input(data);
	}

	public acknowledgeDataEvent(charCount: number): void {
		return this.process.acknowledgeDataEvent(charCount);
	}

	public resize(cols: number, rows: number): void {
		this.cols = cols;
		this.rows = rows;
		return this.process.resize(cols, rows);
	}

	/**
	 * Serializable terminal information that can be sent to the client.
	 */
	public async description(id: number): Promise<terminal.IRemoteTerminalDescriptionDto> {
		const cwd = await this.getCwd();
		return {
			id,
			pid: this.pid,
			title: this.title,
			cwd,
			workspaceId: this.workspaceId,
			workspaceName: this.workspaceName,
			isOrphan: this.isOrphan,
		};
	}
}

// References: - ../../workbench/api/node/extHostTerminalService.ts
//             - ../../workbench/contrib/terminal/browser/terminalProcessManager.ts
export class TerminalProviderChannel implements IServerChannel<RemoteAgentConnectionContext>, IDisposable {
	private readonly terminals = new Map<number, Terminal>();
	private id = 0;

	private readonly layouts = new Map<string, terminal.ISetTerminalLayoutInfoArgs>();

	public constructor (private readonly logService: ILogService) {

	}

	public listen(_: RemoteAgentConnectionContext, event: string, args?: any): Event<any> {
		switch (event) {
			case '$onTerminalProcessEvent': return this.onTerminalProcessEvent(args);
		}

		throw new Error(`Invalid listen '${event}'`);
	}

	private onTerminalProcessEvent(args: terminal.IOnTerminalProcessEventArguments): Event<terminal.IRemoteTerminalProcessEvent> {
		return this.getTerminal(args.id).onEvent;
	}

	public call(context: RemoteAgentConnectionContext, command: string, args?: any): Promise<any> {
		switch (command) {
			case '$createTerminalProcess': return this.createTerminalProcess(context.remoteAuthority, args);
			case '$startTerminalProcess': return this.startTerminalProcess(args);
			case '$sendInputToTerminalProcess': return this.sendInputToTerminalProcess(args);
			case '$sendCharCountToTerminalProcess': return this.sendCharCountToTerminalProcess(args);
			case '$shutdownTerminalProcess': return this.shutdownTerminalProcess(args);
			case '$resizeTerminalProcess': return this.resizeTerminalProcess(args);
			case '$getTerminalInitialCwd': return this.getTerminalInitialCwd(args);
			case '$getTerminalCwd': return this.getTerminalCwd(args);
			case '$sendCommandResultToTerminalProcess': return this.sendCommandResultToTerminalProcess(args);
			case '$orphanQuestionReply': return this.orphanQuestionReply(args[0]);
			case '$listTerminals': return this.listTerminals(args[0]);
			case '$setTerminalLayoutInfo': return this.setTerminalLayoutInfo(args);
			case '$getTerminalLayoutInfo': return this.getTerminalLayoutInfo(args);
		}

		throw new Error(`Invalid call '${command}'`);
	}

	public dispose(): void {
		this.terminals.forEach((t) => t.dispose());
	}

	private async createTerminalProcess(remoteAuthority: string, args: terminal.ICreateTerminalProcessArguments): Promise<terminal.ICreateTerminalProcessResult> {
		const terminalId = this.id++;
		logger.debug('Creating terminal', field('id', terminalId), field('terminals', this.terminals.size));

		const shellLaunchConfig: IShellLaunchConfig = {
			name: args.shellLaunchConfig.name,
			executable: args.shellLaunchConfig.executable,
			args: args.shellLaunchConfig.args,
			// TODO: Should we transform if it's a string as well? The incoming
			// transform only takes `UriComponents` so I suspect it's not necessary.
			cwd: typeof args.shellLaunchConfig.cwd !== 'string'
				? transformIncoming(remoteAuthority, args.shellLaunchConfig.cwd)
				: args.shellLaunchConfig.cwd,
			env: args.shellLaunchConfig.env,
		};

		const activeWorkspaceUri = transformIncoming(remoteAuthority, args.activeWorkspaceFolder?.uri);
		const activeWorkspace = activeWorkspaceUri && args.activeWorkspaceFolder ? {
			...args.activeWorkspaceFolder,
			uri: activeWorkspaceUri,
			toResource: (relativePath: string) => resources.joinPath(activeWorkspaceUri, relativePath),
		} : undefined;

		const resolverService = new VariableResolverService(remoteAuthority, args, process.env as platform.IProcessEnvironment);
		const resolver = terminalEnvironment.createVariableResolver(activeWorkspace, resolverService);

		const getDefaultShellAndArgs = async (): Promise<{ executable: string; args: string[] | string }> => {
			if (shellLaunchConfig.executable) {
				const executable = resolverService.resolve(activeWorkspace, shellLaunchConfig.executable);
				let resolvedArgs: string[] | string = [];
				if (shellLaunchConfig.args && Array.isArray(shellLaunchConfig.args)) {
					for (const arg of shellLaunchConfig.args) {
						resolvedArgs.push(resolverService.resolve(activeWorkspace, arg));
					}
				} else if (shellLaunchConfig.args) {
					resolvedArgs = resolverService.resolve(activeWorkspace, shellLaunchConfig.args);
				}
				return { executable, args: resolvedArgs };
			}

			const executable = terminalEnvironment.getDefaultShell(
				(key) => args.configuration[key],
				args.isWorkspaceShellAllowed,
				await getSystemShell(platform.platform),
				process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'),
				process.env.windir,
				resolver,
				this.logService,
				false, // useAutomationShell
			);

			const resolvedArgs = terminalEnvironment.getDefaultShellArgs(
				(key) => args.configuration[key],
				args.isWorkspaceShellAllowed,
				false, // useAutomationShell
				resolver,
				this.logService,
			);

			return { executable, args: resolvedArgs };
		};

		const getInitialCwd = (): string => {
			return terminalEnvironment.getCwd(
				shellLaunchConfig,
				os.homedir(),
				resolver,
				activeWorkspaceUri,
				args.configuration['terminal.integrated.cwd'],
				this.logService,
			);
		};

		// Use a separate var so Typescript recognizes these properties are no
		// longer undefined.
		const resolvedShellLaunchConfig = {
			...shellLaunchConfig,
			...(await getDefaultShellAndArgs()),
			cwd: getInitialCwd(),
		};

		logger.debug('Resolved shell launch configuration', field('id', terminalId));

		// Use instead of `terminal.integrated.env.${platform}` to make types work.
		const getEnvFromConfig = (): terminal.ISingleTerminalConfiguration<ITerminalEnvironment> => {
			if (platform.isWindows) {
				return args.configuration['terminal.integrated.env.windows'];
			} else if (platform.isMacintosh) {
				return args.configuration['terminal.integrated.env.osx'];
			}
			return args.configuration['terminal.integrated.env.linux'];
		};

		const getNonInheritedEnv = async (): Promise<platform.IProcessEnvironment> => {
			const env = await getMainProcessParentEnv();
			env.VSCODE_IPC_HOOK_CLI = process.env['VSCODE_IPC_HOOK_CLI']!;
			return env;
		};

		const env = terminalEnvironment.createTerminalEnvironment(
			shellLaunchConfig,
			getEnvFromConfig(),
			resolver,
			args.isWorkspaceShellAllowed,
			product.version,
			args.configuration['terminal.integrated.detectLocale'],
			args.configuration['terminal.integrated.inheritEnv'] !== false
				? process.env as platform.IProcessEnvironment
				: await getNonInheritedEnv()
		);

		// Apply extension environment variable collections to the environment.
		if (!shellLaunchConfig.strictEnv) {
			// They come in an array and in serialized format.
			const envVariableCollections = new Map<string, IEnvironmentVariableCollection>();
			for (const [k, v] of args.envVariableCollections) {
				envVariableCollections.set(k, { map: deserializeEnvironmentVariableCollection(v) });
			}
			const mergedCollection = new MergedEnvironmentVariableCollection(envVariableCollections);
			mergedCollection.applyToProcessEnvironment(env);
		}

		logger.debug('Resolved terminal environment', field('id', terminalId));

		const terminal = new Terminal(terminalId, resolvedShellLaunchConfig, args, env, this.logService);
		this.terminals.set(terminalId, terminal);
		logger.debug('Created terminal', field('id', terminalId));
		terminal.onDispose(() => this.terminals.delete(terminalId));

		return {
			terminalId,
			resolvedShellLaunchConfig,
		};
	}

	private getTerminal(id: number): Terminal {
		const terminal = this.terminals.get(id);
		if (!terminal) {
			throw new Error(`terminal with id ${id} does not exist`);
		}
		return terminal;
	}

	private async startTerminalProcess(args: terminal.IStartTerminalProcessArguments): Promise<ITerminalLaunchError | void> {
		return this.getTerminal(args.id).start();
	}

	private async sendInputToTerminalProcess(args: terminal.ISendInputToTerminalProcessArguments): Promise<void> {
		return this.getTerminal(args.id).input(args.data);
	}

	private async sendCharCountToTerminalProcess(args: terminal.ISendCharCountToTerminalProcessArguments): Promise<void> {
		return this.getTerminal(args.id).acknowledgeDataEvent(args.charCount);
	}

	private async shutdownTerminalProcess(args: terminal.IShutdownTerminalProcessArguments): Promise<void> {
		return this.getTerminal(args.id).shutdown(args.immediate);
	}

	private async resizeTerminalProcess(args: terminal.IResizeTerminalProcessArguments): Promise<void> {
		return this.getTerminal(args.id).resize(args.cols, args.rows);
	}

	private async getTerminalInitialCwd(args: terminal.IGetTerminalInitialCwdArguments): Promise<string> {
		return this.getTerminal(args.id).getInitialCwd();
	}

	private async getTerminalCwd(args: terminal.IGetTerminalCwdArguments): Promise<string> {
		return this.getTerminal(args.id).getCwd();
	}

	private async sendCommandResultToTerminalProcess(_: terminal.ISendCommandResultToTerminalProcessArguments): Promise<void> {
		// NOTE: Not required unless we implement the `execCommand` event, see above.
		throw new Error('not implemented');
	}

	private async orphanQuestionReply(_: terminal.IOrphanQuestionReplyArgs): Promise<void> {
		// NOTE: Not required unless we implement the `orphan?` event, see above.
		throw new Error('not implemented');
	}

	private async listTerminals(_: terminal.IListTerminalsArgs): Promise<terminal.IRemoteTerminalDescriptionDto[]> {
		// TODO: args.isInitialization. Maybe this is to have slightly different
		// behavior when first listing terminals but I don't know what you'd want to
		// do differently. Maybe it's to reset the terminal dispose timeouts or
		// something like that, but why not do it each time you list?
		const terminals = await Promise.all(Array.from(this.terminals).map(async ([id, terminal]) => {
			return terminal.description(id);
		}));

		// Only returned orphaned terminals so we don't end up attaching to
		// terminals already attached elsewhere.
		return terminals.filter((t) => t.isOrphan);
	}

	public async setTerminalLayoutInfo(args: terminal.ISetTerminalLayoutInfoArgs): Promise<void> {
		this.layouts.set(args.workspaceId, args);
	}

	public async getTerminalLayoutInfo(args: terminal.IGetTerminalLayoutInfoArgs): Promise<ITerminalsLayoutInfo | undefined> {
		const layout = this.layouts.get(args.workspaceId);
		if (!layout) {
			return undefined;
		}

		const tabs = await Promise.all(layout.tabs.map(async (tab) => {
			// The terminals are stored by ID so look them up.
			const terminals = await Promise.all(tab.terminals.map(async (t) => {
				const terminal = this.terminals.get(t.terminal);
				if (!terminal) {
					return undefined;
				}
				return {
					...t,
					terminal: await terminal.description(t.terminal),
				};
			}));

			return {
				...tab,
				// Filter out terminals that have been killed.
				terminals: terminals.filter(isDefined),
			};
		}));

		return { tabs };
	}
}

function transformIncoming(remoteAuthority: string, uri: UriComponents | undefined): URI | undefined {
	const transformer = getUriTransformer(remoteAuthority);
	return uri ? URI.revive(transformer.transformIncoming(uri)) : uri;
}

function isDefined<T>(t: T | undefined): t is T {
	return typeof t !== 'undefined';
}
