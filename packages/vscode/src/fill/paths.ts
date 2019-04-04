import { InitData, SharedProcessData } from "@coder/protocol";

class Paths {
	private _appData: string | undefined;
	private _defaultUserData: string | undefined;
	private _socketPath: string | undefined;
	private _extensionsDirectory: string | undefined;
	private _builtInExtensionsDirectory: string | undefined;
	private _workingDirectory: string | undefined;

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

	public get workingDirectory(): string {
		if (!this._workingDirectory) {
			throw new Error("trying to access working directory before it has been set");
		}

		return this._workingDirectory;
	}

	public initialize(data: InitData, sharedData: SharedProcessData): void {
		process.env.VSCODE_LOGS = sharedData.logPath;
		this._appData = data.dataDirectory;
		this._defaultUserData = data.dataDirectory;
		this._socketPath = sharedData.socketPath;
		this._extensionsDirectory = data.extensionsDirectory;
		this._builtInExtensionsDirectory = data.builtInExtensionsDirectory;
		this._workingDirectory = data.workingDirectory;
	}
}

export const _paths = new Paths();
export const getAppDataPath = (): string => _paths.appData;
export const getDefaultUserDataPath = (): string => _paths.defaultUserData;
export const getWorkingDirectory = (): string => _paths.workingDirectory;
export const getExtensionsDirectory = (): string => _paths.extensionsDirectory;
export const getBuiltInExtensionsDirectory = (): string => _paths.builtInExtensionsDirectory;
export const getSocketPath = (): string => _paths.socketPath;
