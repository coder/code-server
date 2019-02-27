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
 * Stringify an event argument. isError is because although methods like
 * `fs.stat` are supposed to throw Error objects, they currently throw regular
 * objects when running tests through Jest.
 */
export const stringify = (arg: any, isError?: boolean): string => { // tslint:disable-line no-any
	if (arg instanceof Error || isError) {
		// Errors don't stringify at all. They just become "{}".
		return JSON.stringify({
			type: "Error",
			data: {
				message: arg.message,
				stack: arg.stack,
				code: (arg as NodeJS.ErrnoException).code,
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
	const convert = (value: any): any => { // tslint:disable-line no-any
		if (value && value.data && value.type) {
			switch (value.type) {
				// JSON.stringify turns a Buffer into an object but JSON.parse doesn't
				// turn it back, it just remains an object.
				case "Buffer":
					if (Array.isArray(value.data)) {
						return Buffer.from(value);
					}
					break;
				// Errors apparently can't be stringified, so we do something similar to
				// what happens to buffers and stringify them as regular objects.
				case "Error":
					if (value.data.message) {
						const error = new Error(value.data.message);
						// TODO: Can we set the stack? Doing so seems to make it into an
						// "invalid object".
						if (typeof value.data.code !== "undefined") {
							(error as NodeJS.ErrnoException).code = value.data.code;
						}
						// tslint:disable-next-line no-any
						(error as any).originalStack = value.data.stack;

						return error;
					}
					break;
			}
		}

		if (value && typeof value === "object") {
			Object.keys(value).forEach((key) => {
				value[key] = convert(value[key]);
			});
		}

		return value;
	};

	return arg ? convert(JSON.parse(arg)) : arg;
};
