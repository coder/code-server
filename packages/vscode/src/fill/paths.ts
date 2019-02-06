import { InitData, SharedProcessData } from "@coder/protocol";

class Paths {
	private _appData: string | undefined;
	private _defaultUserData: string | undefined;
	private _socketPath: string | undefined;

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

	public initialize(data: InitData, sharedData: SharedProcessData): void {
		process.env.VSCODE_LOGS = sharedData.logPath;
		this._appData = data.dataDirectory;
		this._defaultUserData = data.dataDirectory;
		this._socketPath = sharedData.socketPath;
	}
}

export const _paths = new Paths();
export const getAppDataPath = (): string => _paths.appData;
export const getDefaultUserDataPath = (): string => _paths.defaultUserData;
