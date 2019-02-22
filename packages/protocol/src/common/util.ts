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
 * Stringify an event argument.
 */
export const stringify = (arg: any): string => { // tslint:disable-line no-any
	if (arg instanceof Error) {
		// Errors don't stringify at all. They just become "{}".
		return JSON.stringify({
			type: "Error",
			data: {
				message: arg.message,
				name: arg.name,
				stack: arg.stack,
			},
		});
	} else if (arg instanceof Uint8Array) {
		// With stringify, these get turned into objects with each index becoming a
		// key for some reason. Then trying to do something like write that data
		// results in [object Object] being written. Stringify them like a Buffer
		// instead.
		return JSON.stringify({
			type: "Buffer",
			data: Array.from(arg),
		});
	}

	return JSON.stringify(arg);
};
/**
 * Parse an event argument.
 */
export const parse = (arg: string): any => { // tslint:disable-line no-any
	if (!arg) {
		return arg;
	}

	const result = JSON.parse(arg);

	if (result && result.data && result.type) {
		switch (result.type) {
			// JSON.stringify turns a Buffer into an object but JSON.parse doesn't
			// turn it back, it just remains an object.
			case "Buffer":
				if (Array.isArray(result.data)) {
					return Buffer.from(result);
				}
				break;
			// Errors apparently can't be stringified, so we do something similar to
			// what happens to buffers and stringify them as regular objects.
			case "Error":
				if (result.data.message) {
					return new Error(result.data.message);
				}
				break;
		}
	}

	return result;
};
