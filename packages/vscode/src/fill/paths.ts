export const _paths = {
	appData: "/tmp",
	defaultUserData: "/tmp",
	socketPath: "/tmp/vscode-online.sock",
};

export const getAppDataPath = (): string => _paths.appData;
export const getDefaultUserDataPath = (): string => _paths.defaultUserData;
