import * as path from "path";

import { getPathFromAmdModule } from "vs/base/common/amd";
import { VSBuffer } from "vs/base/common/buffer";
import { Emitter, Event } from "vs/base/common/event";
import { IDisposable } from "vs/base/common/lifecycle";
import { OS } from "vs/base/common/platform";
import { URI, UriComponents } from "vs/base/common/uri";
import { transformOutgoingURIs } from "vs/base/common/uriIpc";
import { IServerChannel } from "vs/base/parts/ipc/common/ipc";
import { IDiagnosticInfo } from "vs/platform/diagnostics/common/diagnosticsService";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { IExtensionDescription, ExtensionIdentifier } from "vs/platform/extensions/common/extensions";
import { FileDeleteOptions, FileOverwriteOptions, FileType, IStat, IWatchOptions, FileOpenOptions } from "vs/platform/files/common/files";
import { ILogService } from "vs/platform/log/common/log";
import pkg from "vs/platform/product/node/package";
import product from "vs/platform/product/node/product";
import { IRemoteAgentEnvironment } from "vs/platform/remote/common/remoteAgentEnvironment";
import { ExtensionScanner, ExtensionScannerInput } from "vs/workbench/services/extensions/node/extensionPoints";
import { DiskFileSystemProvider } from "vs/workbench/services/files/node/diskFileSystemProvider";

import { getUriTransformer } from "vs/server/src/util";

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

/**
 * See: src/vs/platform/remote/common/remoteAgentFileSystemChannel.ts.
 */
export class FileProviderChannel implements IServerChannel, IDisposable {
	private readonly provider: DiskFileSystemProvider;
	private readonly watchers = new Map<string, Watcher>();

	public constructor(private readonly logService: ILogService) {
		this.provider = new DiskFileSystemProvider(this.logService);
	}

	public listen(context: any, event: string, args?: any): Event<any> {
		switch (event) {
			// This is where the actual file changes are sent. The watch method just
			// adds things that will fire here. That means we have to split up
			// watchers based on the session otherwise sessions would get events for
			// other sessions. There is also no point in having the watcher unless
			// something is listening. I'm not sure there is a different way to
			// dispose, anyway.
			case "filechange":
				const session = args[0];
				const emitter = new Emitter({
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
						provider.onDidErrorOccur((event) => emitter.fire(event));
					},
					onLastListenerRemove: () => {
						this.watchers.get(session)!.dispose();
						this.watchers.delete(session);
					},
				});

				return emitter.event;
		}

		throw new Error(`Invalid listen "${event}"`);
	}

	public call(_: unknown, command: string, args?: any): Promise<any> {
		switch (command) {
			case "stat": return this.stat(args[0]);
			case "open": return this.open(args[0], args[1]);
			case "close": return this.close(args[0]);
			case "read": return this.read(args[0], args[1], args[2]);
			case "write": return this.write(args[0], args[1], args[2], args[3], args[4]);
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
		return this.provider.stat(URI.from(resource));
	}

	private async open(resource: UriComponents, opts: FileOpenOptions): Promise<number> {
		return this.provider.open(URI.from(resource), opts);
	}

	private async close(fd: number): Promise<void> {
		return this.provider.close(fd);
	}

	private async read(fd: number, pos: number, length: number): Promise<[VSBuffer, number]> {
		const buffer = VSBuffer.alloc(length);
		const bytesRead = await this.provider.read(fd, pos, buffer.buffer, 0, length);
		return [buffer, bytesRead];
	}

	private write(fd: number, pos: number, buffer: VSBuffer, offset: number, length: number): Promise<number> {
		return this.provider.write(fd, pos, buffer.buffer, offset, length);
	}

	private async delete(resource: UriComponents, opts: FileDeleteOptions): Promise<void> {
		return this.provider.delete(URI.from(resource), opts);
	}

	private async mkdir(resource: UriComponents): Promise<void> {
		return this.provider.mkdir(URI.from(resource));
	}

	private async readdir(resource: UriComponents): Promise<[string, FileType][]> {
		return this.provider.readdir(URI.from(resource));
	}

	private async rename(resource: UriComponents, target: UriComponents, opts: FileOverwriteOptions): Promise<void> {
		return this.provider.rename(URI.from(resource), URI.from(target), opts);
	}

	private copy(resource: UriComponents, target: UriComponents, opts: FileOverwriteOptions): Promise<void> {
		return this.provider.copy(URI.from(resource), URI.from(target), opts);
	}

	private async watch(session: string, req: number, resource: UriComponents, opts: IWatchOptions): Promise<void> {
		this.watchers.get(session)!._watch(req, URI.from(resource), opts);
	}

	private async unwatch(session: string, req: number): Promise<void> {
		this.watchers.get(session)!.unwatch(req);
	}
}

/**
 * See: src/vs/workbench/services/remote/common/remoteAgentEnvironmentChannel.ts.
 */
export class ExtensionEnvironmentChannel implements IServerChannel {
	public constructor(
		private readonly environment: IEnvironmentService,
		private readonly log: ILogService,
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
			appRoot: URI.file(this.environment.appRoot),
			appSettingsHome: this.environment.appSettingsHome,
			settingsPath: this.environment.machineSettingsHome,
			logsPath: URI.file(this.environment.logsPath),
			extensionsPath: URI.file(this.environment.extensionsPath),
			extensionHostLogsPath: URI.file(path.join(this.environment.logsPath, "extension-host")),
			globalStorageHome: URI.file(this.environment.globalStorageHome),
			userHome: URI.file(this.environment.userHome),
			extensions: await this.scanExtensions(locale),
			os: OS,
		};
	}

	private async scanExtensions(locale: string): Promise<IExtensionDescription[]> {
		const root = getPathFromAmdModule(require, "");

		const translations = {}; // TODO: translations

		// TODO: there is also this.environment.extensionDevelopmentLocationURI to look into.
		const scanBuiltin = async (): Promise<IExtensionDescription[]> => {
			const input = new ExtensionScannerInput(
				pkg.version, product.commit, locale, !!process.env.VSCODE_DEV,
				path.resolve(root, "../extensions"),
				true,
				false,
				translations,
			);
			const extensions = await ExtensionScanner.scanExtensions(input, this.log);
			// TODO: there is more to do if process.env.VSCODE_DEV is true.
			return extensions;
		};

		const scanInstalled = async (): Promise<IExtensionDescription[]> => {
			const input = new ExtensionScannerInput(
				pkg.version, product.commit, locale, !!process.env.VSCODE_DEV,
				this.environment.extensionsPath, false, true, translations,
			);
			return ExtensionScanner.scanExtensions(input, this.log);
		};

		return Promise.all([scanBuiltin(), scanInstalled()]).then((allExtensions) => {
			// It's possible to get duplicates.
			const uniqueExtensions = new Map<string, IExtensionDescription>();
			allExtensions.forEach((extensions) => {
				extensions.forEach((extension) => {
					const id = ExtensionIdentifier.toKey(extension.identifier);
					if (uniqueExtensions.has(id)) {
						const oldPath = uniqueExtensions.get(id)!.extensionLocation.fsPath;
						const newPath = extension.extensionLocation.fsPath;
						this.log.warn(
							`Extension ${id} in ${oldPath} has been overridden ${newPath}`,
						);
					}
					uniqueExtensions.set(id, extension);
				});
			});

			const finalExtensions = <IExtensionDescription[]>[];
			uniqueExtensions.forEach((e) => finalExtensions.push(e));
			return finalExtensions;
		});
	}

	private getDiagnosticInfo(): Promise<IDiagnosticInfo> {
		throw new Error("not implemented");
	}

	private disableTelemetry(): Promise<void> {
		throw new Error("not implemented");
	}
}
