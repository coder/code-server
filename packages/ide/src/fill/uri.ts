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
