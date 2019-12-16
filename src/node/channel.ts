import * as path from "path";
import { VSBuffer, VSBufferReadableStream } from "vs/base/common/buffer";
import { Emitter, Event } from "vs/base/common/event";
import { IDisposable } from "vs/base/common/lifecycle";
import { OS } from "vs/base/common/platform";
import { ReadableStreamEventPayload } from "vs/base/common/stream";
import { URI, UriComponents } from "vs/base/common/uri";
import { transformOutgoingURIs } from "vs/base/common/uriIpc";
import { IServerChannel } from "vs/base/parts/ipc/common/ipc";
import { IDiagnosticInfo } from "vs/platform/diagnostics/common/diagnostics";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { ExtensionIdentifier, IExtensionDescription } from "vs/platform/extensions/common/extensions";
import { FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileReadStreamOptions, FileType, FileWriteOptions, IStat, IWatchOptions } from "vs/platform/files/common/files";
import { createReadStream } from "vs/platform/files/common/io";
import { DiskFileSystemProvider } from "vs/platform/files/node/diskFileSystemProvider";
import { ILogService } from "vs/platform/log/common/log";
import product from "vs/platform/product/common/product";
import { IRemoteAgentEnvironment, RemoteAgentConnectionContext } from "vs/platform/remote/common/remoteAgentEnvironment";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { INodeProxyService } from "vs/server/src/common/nodeProxy";
import { getTranslations } from "vs/server/src/node/nls";
import { getUriTransformer, localRequire } from "vs/server/src/node/util";
import { IFileChangeDto } from "vs/workbench/api/common/extHost.protocol";
import { ExtensionScanner, ExtensionScannerInput } from "vs/workbench/services/extensions/node/extensionPoints";

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
		private readonly environmentService: IEnvironmentService,
		private readonly logService: ILogService,
	) {
		this.provider = new DiskFileSystemProvider(this.logService);
	}

	public listen(context: RemoteAgentConnectionContext, event: string, args?: any): Event<any> {
		switch (event) {
			case "filechange": return this.filechange(context, args[0]);
			case "readFileStream": return this.readFileStream(args[0], args[1]);
		}

		throw new Error(`Invalid listen "${event}"`);
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
		let fileStream: VSBufferReadableStream | undefined;
		const emitter = new Emitter<ReadableStreamEventPayload<VSBuffer>>({
			onFirstListenerAdd: () => {
				if (!fileStream) {
					fileStream = createReadStream(this.provider, this.transform(resource), {
						...opts,
						bufferSize: 64 * 1024, // From DiskFileSystemProvider
					});
					fileStream.on("data", (data) => emitter.fire(data));
					fileStream.on("error", (error) => emitter.fire(error));
					fileStream.on("end", () => emitter.fire("end"));
				}
			},
			onLastListenerRemove: () => fileStream && fileStream.destroy(),
		});

		return emitter.event;
	}

	public call(_: unknown, command: string, args?: any): Promise<any> {
		switch (command) {
			case "stat": return this.stat(args[0]);
			case "open": return this.open(args[0], args[1]);
			case "close": return this.close(args[0]);
			case "read": return this.read(args[0], args[1], args[2]);
			case "readFile": return this.readFile(args[0]);
			case "write": return this.write(args[0], args[1], args[2], args[3], args[4]);
			case "writeFile": return this.writeFile(args[0], args[1], args[2]);
			case "delete": return this.delete(args[0], args[1]);
			case "mkdir": return this.mkdir(args[0]);
			case "readdir": return this.readdir(args[0]);
			case "rename": return this.rename(args[0], args[1], args[2]);
			case "copy": return this.copy(args[0], args[1], args[2]);
			case "watch": return this.watch(args[0], args[1], args[2], args[3]);
			case "unwatch": return this.unwatch(args[0], args[1]);
		}

		throw new Error(`Invalid call "${command}"`);
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
			return URI.file(this.environmentService.appRoot + resource.path.replace(/^\/static[^/]*\//, "/"));
		// Used by the webview service worker to load resources.
		} else if (resource.path === "/vscode-resource" && resource.query) {
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

export class ExtensionEnvironmentChannel implements IServerChannel {
	public constructor(
		private readonly environment: IEnvironmentService,
		private readonly log: ILogService,
		private readonly telemetry: ITelemetryService,
		private readonly connectionToken: string,
	) {}

	public listen(_: unknown, event: string): Event<any> {
		throw new Error(`Invalid listen "${event}"`);
	}

	public async call(context: any, command: string, args?: any): Promise<any> {
		switch (command) {
			case "getEnvironmentData":
				return transformOutgoingURIs(
					await this.getEnvironmentData(args.language),
					getUriTransformer(context.remoteAuthority),
				);
			case "getDiagnosticInfo": return this.getDiagnosticInfo();
			case "disableTelemetry": return this.disableTelemetry();
		}
		throw new Error(`Invalid call "${command}"`);
	}

	private async getEnvironmentData(locale: string): Promise<IRemoteAgentEnvironment> {
		return {
			pid: process.pid,
			connectionToken: this.connectionToken,
			appRoot: URI.file(this.environment.appRoot),
			appSettingsHome: this.environment.appSettingsHome,
			settingsPath: this.environment.machineSettingsHome,
			logsPath: URI.file(this.environment.logsPath),
			extensionsPath: URI.file(this.environment.extensionsPath!),
			extensionHostLogsPath: URI.file(path.join(this.environment.logsPath, "extension-host")),
			globalStorageHome: URI.file(this.environment.globalStorageHome),
			userHome: URI.file(this.environment.userHome),
			extensions: await this.scanExtensions(locale),
			os: OS,
		};
	}

	private async scanExtensions(locale: string): Promise<IExtensionDescription[]> {
		const translations = await getTranslations(locale, this.environment.userDataPath);

		const scanMultiple = (isBuiltin: boolean, isUnderDevelopment: boolean, paths: string[]): Promise<IExtensionDescription[][]> => {
			return Promise.all(paths.map((path) => {
				return ExtensionScanner.scanExtensions(new ExtensionScannerInput(
					product.version,
					product.commit,
					locale,
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
		throw new Error("not implemented");
	}

	private async disableTelemetry(): Promise<void> {
		this.telemetry.setEnabled(false);
	}
}

export class NodeProxyService implements INodeProxyService {
	public _serviceBrand = undefined;

	public readonly server: import("@coder/node-browser/out/server/server").Server;

	private readonly _onMessage = new Emitter<string>();
	public readonly onMessage = this._onMessage.event;
	private readonly _$onMessage = new Emitter<string>();
	public readonly $onMessage = this._$onMessage.event;
	public readonly _onDown = new Emitter<void>();
	public readonly onDown = this._onDown.event;
	public readonly _onUp = new Emitter<void>();
	public readonly onUp = this._onUp.event;

	// Unused because the server connection will never permanently close.
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;

	public constructor() {
		// TODO: down/up
		const { Server } = localRequire<typeof import("@coder/node-browser/out/server/server")>("@coder/node-browser/out/server/server");
		this.server = new Server({
			onMessage: this.$onMessage,
			onClose: this.onClose,
			onDown: this.onDown,
			onUp: this.onUp,
			send: (message: string): void => {
				this._onMessage.fire(message);
			}
		});
	}

	public send(message: string): void {
		this._$onMessage.fire(message);
	}
}
