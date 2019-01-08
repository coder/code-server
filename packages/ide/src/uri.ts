export interface IURI {

	readonly path: string;
	readonly fsPath: string;
	readonly scheme: string;

}

export interface IURIFactory {

	/**
	 * Convert the object to an instance of a real URI.
	 */
	create<T extends IURI>(uri: IURI): T;
	file(path: string): IURI;
	parse(raw: string): IURI;

}

let activeUriFactory: IURIFactory;

/**
 * Get the active URI factory
 */
export const getFactory = (): IURIFactory => {
	if (!activeUriFactory) {
		throw new Error("default uri factory not set");
	}

	return activeUriFactory;
};

/**
 * Update the active URI factory.
 */
export const setUriFactory = (factory: IURIFactory): void => {
	activeUriFactory = factory;
};

export interface IUriSwitcher {

	strip(uri: IURI): IURI;
	prepend(uri: IURI): IURI;

}
