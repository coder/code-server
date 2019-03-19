// `any` is needed to deal with sending and receiving arguments of any type.
// tslint:disable no-any

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
	encoding?: BufferEncoding | null;
	flag?: string;
	mode?: string;
	persistent?: boolean;
	recursive?: boolean;
} | BufferEncoding | undefined | null;

export type IEncodingOptionsCallback = IEncodingOptions | ((err: NodeJS.ErrnoException, ...args: any[]) => void);

interface StringifiedError {
	type: "error";
	data: {
		message: string;
		stack?: string;
		code?: string;
	};
}

interface StringifiedBuffer {
	type: "buffer";
	data: number[];
}

interface StringifiedObject {
	type: "object";
	data: { [key: string]: StringifiedValue };
}

interface StringifiedArray {
	type: "array";
	data: StringifiedValue[];
}

interface StringifiedProxy {
	type: "proxy";
}

interface StringifiedUndefined {
	type: "undefined";
}

type StringifiedValue = StringifiedProxy | StringifiedUndefined
	| StringifiedObject | StringifiedArray | StringifiedBuffer | StringifiedError
	| number | string | boolean;

const isPrimitive = (value: any): value is number | string | boolean => {
	return typeof value === "number"
		|| typeof value === "string"
		|| typeof value === "boolean";
};
/**
 * Stringify an argument or a return value.
 */
export const stringify = (value: any): string => {
	const convert = (currentValue: any): StringifiedValue => {
		// Errors don't stringify at all. They just become "{}".
		// For some reason when running in Jest errors aren't instances of Error,
		// so also check against the values.
		if (currentValue instanceof Error
			|| (currentValue && typeof currentValue.message !== "undefined"
				&& typeof currentValue.stack !== "undefined")) {
			return {
				type: "error",
				data: {
					message: currentValue.message,
					stack: currentValue.stack,
					code: (currentValue as NodeJS.ErrnoException).code,
				},
			};
		}

		// With stringify, Uint8Array gets turned into objects with each index
		// becoming a key for some reason. Then trying to do something like write
		// that data results in [object Object] being written. Stringify them like
		// a Buffer instead. Also handle Buffer so it doesn't get caught by the
		// object check and to get the same type.
		if (currentValue instanceof Uint8Array || currentValue instanceof Buffer) {
			return {
				type: "buffer",
				data: Array.from(currentValue),
			};
		}

		if (Array.isArray(currentValue)) {
			return {
				type: "array",
				data: currentValue.map((a) => convert(a)),
			};
		}

		if (currentValue !== null && typeof currentValue === "object") {
			const converted: { [key: string]: StringifiedValue } = {};
			Object.keys(currentValue).forEach((key) => {
				converted[key] = convert(currentValue[key]);
			});

			return {
				type: "object",
				data: converted,
			};
		}

		// `undefined` can't be stringified.
		if (typeof currentValue === "undefined") {
			return {
				type: "undefined",
			};
		}

		if (!isPrimitive(currentValue)) {
			throw new Error(`cannot stringify ${typeof currentValue}`);
		}

		return currentValue;
	};

	return JSON.stringify(convert(value));
};

/**
 * Parse an argument.
 */
export const parse = (value?: string): any => {
	const convert = (currentValue: StringifiedValue): any => {
		if (currentValue && !isPrimitive(currentValue)) {
			// Would prefer a switch but the types don't seem to work.
			if (currentValue.type === "buffer") {
				return Buffer.from(currentValue.data);
			}

			if (currentValue.type === "error") {
				const error = new Error(currentValue.data.message);
				if (typeof currentValue.data.code !== "undefined") {
					(error as NodeJS.ErrnoException).code = currentValue.data.code;
				}
				(error as any).originalStack = currentValue.data.stack;

				return error;
			}

			if (currentValue.type === "object") {
				const converted: { [key: string]: any } = {};
				Object.keys(currentValue.data).forEach((key) => {
					converted[key] = convert(currentValue.data[key]);
				});

				return converted;
			}

			if (currentValue.type === "array") {
				return currentValue.data.map(convert);
			}

			if (currentValue.type === "undefined") {
				return undefined;
			}
		}

		return currentValue;
	};

	return value && convert(JSON.parse(value));
};
