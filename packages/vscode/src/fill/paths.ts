export const _paths = {
	appData: "/tmp",
	defaultUserData: "/tmp",
	socketPath: "/tmp/vscode-remote.sock",
};

export const getAppDataPath = (): string => _paths.appData;
export const getDefaultUserDataPath = (): string => _paths.defaultUserData;
