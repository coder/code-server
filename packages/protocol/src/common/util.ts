import { Module as ProtoModule, WorkingInitMessage } from "../proto";
import { OperatingSystem } from "../common/connection";
import { Module, ServerProxy } from "./proxy";

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
	data: {
		id: number;
	};
}

interface StringifiedFunction {
	type: "function";
	data: {
		id: number;
	};
}

interface StringifiedUndefined {
	type: "undefined";
}

type StringifiedValue = StringifiedFunction | StringifiedProxy
	| StringifiedUndefined | StringifiedObject | StringifiedArray
	| StringifiedBuffer | StringifiedError | number | string | boolean | null;

const isPrimitive = (value: any): value is number | string | boolean | null => {
	return typeof value === "number"
		|| typeof value === "string"
		|| typeof value === "boolean"
		|| value === null;
};

/**
 * Stringify an argument or a return value.
 * If sending a function is possible, provide `storeFunction`.
 * If sending a proxy is possible, provide `storeProxy`.
 */
export const stringify = (
	value: any,
	storeFunction?: (fn: () => void) => number,
	storeProxy?: (proxy: ServerProxy) => number,
): string => {
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

		if (isProxy(currentValue)) {
			if (!storeProxy) {
				throw new Error("no way to serialize proxy");
			}

			return {
				type: "proxy",
				data: {
					id: storeProxy(currentValue),
				},
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

		if (typeof currentValue === "function") {
			if (!storeFunction) {
				throw new Error("no way to serialize function");
			}

			return {
				type: "function",
				data: {
					id: storeFunction(currentValue),
				},
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
 * If running a remote callback is supported, provide `runCallback`.
 * If using a remote proxy is supported, provide `createProxy`.
 */
export const parse = (
	value?: string,
	runCallback?: (id: number, args: any[]) => void,
	createProxy?: (id: number) => ServerProxy,
): any => {
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

			if (currentValue.type === "function") {
				if (!runCallback) {
					throw new Error("no way to run remote callback");
				}

				return (...args: any[]): void => {
					return runCallback(currentValue.data.id, args);
				};
			}

			if (currentValue.type === "proxy") {
				if (!createProxy) {
					throw new Error("no way to create proxy");
				}

				return createProxy(currentValue.data.id);
			}
		}

		return currentValue;
	};

	return value && convert(JSON.parse(value));
};

export const protoToModule = (protoModule: ProtoModule): Module => {
	switch (protoModule) {
		case ProtoModule.CHILDPROCESS: return Module.ChildProcess;
		case ProtoModule.FS: return Module.Fs;
		case ProtoModule.NET: return Module.Net;
		case ProtoModule.NODEPTY: return Module.NodePty;
		case ProtoModule.SPDLOG: return Module.Spdlog;
		case ProtoModule.TRASH: return Module.Trash;
		default: throw new Error(`invalid module ${protoModule}`);
	}
};

export const moduleToProto = (moduleName: Module): ProtoModule => {
	switch (moduleName) {
		case Module.ChildProcess: return ProtoModule.CHILDPROCESS;
		case Module.Fs: return ProtoModule.FS;
		case Module.Net: return ProtoModule.NET;
		case Module.NodePty: return ProtoModule.NODEPTY;
		case Module.Spdlog: return ProtoModule.SPDLOG;
		case Module.Trash: return ProtoModule.TRASH;
		default: throw new Error(`invalid module "${moduleName}"`);
	}
};

export const protoToOperatingSystem = (protoOp: WorkingInitMessage.OperatingSystem): OperatingSystem => {
	switch (protoOp) {
		case WorkingInitMessage.OperatingSystem.WINDOWS: return OperatingSystem.Windows;
		case WorkingInitMessage.OperatingSystem.LINUX: return OperatingSystem.Linux;
		case WorkingInitMessage.OperatingSystem.MAC: return OperatingSystem.Mac;
		default: throw new Error(`unsupported operating system ${protoOp}`);
	}
};

export const platformToProto = (platform: NodeJS.Platform): WorkingInitMessage.OperatingSystem => {
	switch (platform) {
		case "win32": return WorkingInitMessage.OperatingSystem.WINDOWS;
		case "linux": return WorkingInitMessage.OperatingSystem.LINUX;
		case "darwin": return WorkingInitMessage.OperatingSystem.MAC;
		default: throw new Error(`unrecognized platform "${platform}"`);
	}
};

export const isProxy = (value: any): value is ServerProxy => {
	return value && typeof value === "object" && typeof value.onEvent === "function";
};

export const isPromise = (value: any): value is Promise<any> => {
	return typeof value.then === "function" && typeof value.catch === "function";
};

/**
 * When spawning VS Code tries to preserve the environment but since it's in
 * the browser, it doesn't work.
 */
export const preserveEnv = (options?: { env?: NodeJS.ProcessEnv } | null): void => {
	if (options && options.env) {
		options.env = { ...process.env, ...options.env };
	}
};
