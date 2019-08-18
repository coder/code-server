import { InitData, SharedProcessData } from "@coder/protocol";

/**
 * Provides paths.
 */
class Paths {
	private _appData: string | undefined;
	private _defaultUserData: string | undefined;
	private _socketPath: string | undefined;
	private _extensionsDirectory: string | undefined;
	private _builtInExtensionsDirectory: string | undefined;
	private _workingDirectory: string | undefined;
	private _extraExtensionDirectories: string[] | undefined;
	private _extraBuiltinExtensionDirectories: string[] | undefined;

	public get appData(): string {
		if (typeof this._appData === "undefined") {
			throw new Error("trying to access appData before it has been set");
		}

		return this._appData;
	}

	public get defaultUserData(): string {
		if (typeof this._defaultUserData === "undefined") {
			throw new Error("trying to access defaultUserData before it has been set");
		}

		return this._defaultUserData;
	}

	public get socketPath(): string {
		if (typeof this._socketPath === "undefined") {
			throw new Error("trying to access socketPath before it has been set");
		}

		return this._socketPath;
	}

	public get extensionsDirectory(): string {
		if (!this._extensionsDirectory) {
			throw new Error("trying to access extensions directory before it has been set");
		}

		return this._extensionsDirectory;
	}

	public get builtInExtensionsDirectory(): string {
		if (!this._builtInExtensionsDirectory) {
			throw new Error("trying to access builtin extensions directory before it has been set");
		}

		return this._builtInExtensionsDirectory;
	}

	public get extraExtensionDirectories(): string[] {
		if (!this._extraExtensionDirectories) {
			throw new Error("trying to access extra extension directories before they have been set");
		}

		return this._extraExtensionDirectories;
	}

	public get extraBuiltinExtensionDirectories(): string[] {
		if (!this._extraBuiltinExtensionDirectories) {
			throw new Error("trying to access extra builtin extension directories before they have been set");
		}

		return this._extraBuiltinExtensionDirectories;
	}

	public get workingDirectory(): string {
		if (!this._workingDirectory) {
			throw new Error("trying to access working directory before it has been set");
		}

		return this._workingDirectory;
	}

	/**
	 * Initialize paths using the provided data.
	 */
	public initialize(data: InitData, sharedData: SharedProcessData): void {
		process.env.VSCODE_LOGS = sharedData.logPath;
		this._appData = data.dataDirectory;
		this._defaultUserData = data.dataDirectory;
		this._socketPath = sharedData.socketPath;
		this._extensionsDirectory = data.extensionsDirectory;
		this._builtInExtensionsDirectory = data.builtInExtensionsDirectory;
		this._workingDirectory = data.workingDirectory;
		this._extraExtensionDirectories = data.extraExtensionDirectories;
		this._extraBuiltinExtensionDirectories = data.extraBuiltinExtensionDirectories;
	}
}

export const _paths = new Paths();
export const getAppDataPath = (): string => _paths.appData;
export const getDefaultUserDataPath = (): string => _paths.defaultUserData;
export const getWorkingDirectory = (): string => _paths.workingDirectory;
export const getExtensionsDirectory = (): string => _paths.extensionsDirectory;
export const getBuiltInExtensionsDirectory = (): string => _paths.builtInExtensionsDirectory;
export const getExtraExtensionDirectories = (): string[] => _paths.extraExtensionDirectories;
export const getExtraBuiltinExtensionDirectories = (): string[] => _paths.extraBuiltinExtensionDirectories;
export const getSocketPath = (): string => _paths.socketPath;
