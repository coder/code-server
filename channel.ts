import * as path from "path";

import { Emitter, Event } from "vs/base/common/event";
import { OS } from "vs/base/common/platform";
import { URI } from "vs/base/common/uri";
import { IServerChannel } from "vs/base/parts/ipc/common/ipc";
import { IDiagnosticInfo } from "vs/platform/diagnostics/common/diagnosticsService";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { FileDeleteOptions, FileOverwriteOptions, FileType, IStat, IWatchOptions, FileOpenOptions } from "vs/platform/files/common/files";
import { IRemoteAgentEnvironment } from "vs/platform/remote/common/remoteAgentEnvironment";

/**
 * See: src/vs/platform/remote/common/remoteAgentFileSystemChannel.ts.
 */
export class FileProviderChannel implements IServerChannel {
	public listen(_context: any, event: string): Event<any> {
		switch (event) {
			case "filechange":
				// TODO: not sure what to do here yet
				return new Emitter().event;
		}

		throw new Error(`Invalid listen "${event}"`);
	}

	public call(_: unknown, command: string, args?: any): Promise<any> {
		console.log("got call", command, args);
		switch (command) {
			case "stat": return this.stat(args[0]);
			case "open": return this.open(args[0], args[1]);
			case "close": return this.close(args[0]);
			case "read": return this.read(args[0], args[1], args[2], args[3], args[4]);
			case "write": return this.write(args[0], args[1], args[2], args[3], args[4]);
			case "delete": return this.delete(args[0], args[1]);
			case "mkdir": return this.mkdir(args[0]);
			case "readdir": return this.readdir(args[0]);
			case "rename": return this.rename(args[0], args[1], args[2]);
			case "copy": return this.copy(args[0], args[1], args[2]);
			case "watch": return this.watch(args[0], args[1]);
			case "unwatch": return this.unwatch(args[0]), args[1];
		}

		throw new Error(`Invalid call "${command}"`);
	}

	private async stat(resource: URI): Promise<IStat> {
		throw new Error("not implemented");
	}

	private async open(resource: URI, opts: FileOpenOptions): Promise<number> {
		throw new Error("not implemented");
	}

	private async close(fd: number): Promise<void> {
		throw new Error("not implemented");
	}

	private async read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
		throw new Error("not implemented");
	}

	private async write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
		throw new Error("not implemented");
	}

	private async delete(resource: URI, opts: FileDeleteOptions): Promise<void> {
		throw new Error("not implemented");
	}

	private async mkdir(resource: URI): Promise<void> {
		throw new Error("not implemented");
	}

	private async readdir(resource: URI): Promise<[string, FileType][]> {
		throw new Error("not implemented");
	}

	private async rename(resource: URI, target: URI, opts: FileOverwriteOptions): Promise<void> {
		throw new Error("not implemented");
	}

	private copy(resource: URI, target: URI, opts: FileOverwriteOptions): Promise<void> {
		throw new Error("not implemented");
	}

	private watch(resource: URI, opts: IWatchOptions): Promise<void> {
		throw new Error("not implemented");
	}

	private unwatch(resource: URI): void {
		throw new Error("not implemented");
	}
}

/**
 * See: src/vs/workbench/services/remote/common/remoteAgentEnvironmentChannel.ts.
 */
export class ExtensionEnvironmentChannel implements IServerChannel {
	public constructor(private readonly environment: IEnvironmentService) {}

	public listen(_context: any, event: string): Event<any> {
		throw new Error(`Invalid listen "${event}"`);
	}

	public call(_: unknown, command: string, args?: any): Promise<any> {
		switch (command) {
			case "getEnvironmentData": return this.getEnvironmentData();
			case "getDiagnosticInfo": return this.getDiagnosticInfo();
			case "disableTelemetry": return this.disableTelemetry();
		}
		throw new Error(`Invalid call "${command}"`);
	}

	private async getEnvironmentData(): Promise<IRemoteAgentEnvironment> {
		return {
			pid: process.pid,
			appRoot: URI.file(this.environment.appRoot),
			appSettingsHome: this.environment.appSettingsHome,
			settingsPath: this.environment.machineSettingsHome,
			logsPath: URI.file(this.environment.logsPath),
			extensionsPath: URI.file(this.environment.extensionsPath),
			extensionHostLogsPath: URI.file(path.join(this.environment.logsPath, "extension-host")), // TODO
			globalStorageHome: URI.file(this.environment.globalStorageHome),
			userHome: URI.file(this.environment.userHome),
			extensions: [], // TODO
			os: OS,
		};
	}

	private getDiagnosticInfo(): Promise<IDiagnosticInfo> {
		throw new Error("not implemented");
	}

	private disableTelemetry(): Promise<void> {
		throw new Error("not implemented");
	}
}
