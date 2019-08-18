import * as jspb from "google-protobuf";

export interface SendableConnection {
	send(data: Buffer | Uint8Array): void;
}

export interface ReadWriteConnection extends SendableConnection {
	onMessage(cb: (data: Uint8Array | Buffer) => void): void;
	onClose(cb: () => void): void;
	onDown(cb: () => void): void;
	onUp(cb: () => void): void;
	close(): void;
}

export enum OperatingSystem {
	Windows,
	Linux,
	Mac,
}

export interface InitData {
	readonly os: OperatingSystem;
	readonly dataDirectory: string;
	readonly workingDirectory: string;
	readonly homeDirectory: string;
	readonly tmpDirectory: string;
	readonly shell: string;
	readonly extensionsDirectory: string;
	readonly builtInExtensionsDirectory: string;
	readonly extraExtensionDirectories: string[];
	readonly extraBuiltinExtensionDirectories: string[];
	readonly env: jspb.Map<string, string>;
}

export interface SharedProcessData {
	readonly socketPath: string;
	readonly logPath: string;
}
