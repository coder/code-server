/**
 * Return true if we're in a browser environment (including web workers).
 */
export const isBrowserEnvironment = (): boolean => {
	return typeof process === "undefined" || typeof process.stdout === "undefined";
};

/**
 * Escape a path. This prevents any issues with file names that have quotes,
 * spaces, braces, etc.
 */
export const escapePath = (path: string): string => {
	return `'${path.replace(/'/g, "'\\''")}'`;
};

export type IEncodingOptions = {
	encoding?: string | null;
	flag?: string;
	mode?: string;
	persistent?: boolean;
	recursive?: boolean;
} | string | undefined | null;

// tslint:disable-next-line no-any
export type IEncodingOptionsCallback = IEncodingOptions | ((err: NodeJS.ErrnoException, ...args: any[]) => void);

/**
 * Return true if the options specify to use a Buffer instead of string.
 */
export const useBuffer = (options: IEncodingOptionsCallback): boolean => {
	return options === "buffer"
		|| (!!options && typeof options !== "string" && typeof options !== "function"
				&& (options.encoding === "buffer" || options.encoding === null));
};
