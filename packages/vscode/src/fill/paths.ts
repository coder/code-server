const paths = {
	appData: "/tmp",
	defaultUserData: "/tmp",
};

export let getAppDataPath = (): string => paths.appData;
export let getDefaultUserDataPath = (): string => paths.defaultUserData;
