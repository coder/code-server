import { Argument, Module as ProtoModule, WorkingInit } from "../proto";
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

/**
 * Convert an argument to proto.
 * If sending a function is possible, provide `storeFunction`.
 * If sending a proxy is possible, provide `storeProxy`.
 */
export const argumentToProto = (
	value: any,
	storeFunction?: (fn: () => void) => number,
	storeProxy?: (proxy: ServerProxy) => number,
): Argument => {
	const convert = (currentValue: any): Argument => {
		const message = new Argument();

		if (currentValue instanceof Error
			|| (currentValue && typeof currentValue.message !== "undefined"
				&& typeof currentValue.stack !== "undefined")) {
			const arg = new Argument.ErrorValue();
			arg.setMessage(currentValue.message);
			arg.setStack(currentValue.stack);
			arg.setCode(currentValue.code);
			message.setError(arg);
		} else if (currentValue instanceof Uint8Array || currentValue instanceof Buffer) {
			const arg = new Argument.BufferValue();
			arg.setData(currentValue);
			message.setBuffer(arg);
		} else if (Array.isArray(currentValue)) {
			const arg = new Argument.ArrayValue();
			arg.setDataList(currentValue.map(convert));
			message.setArray(arg);
		} else if (isProxy(currentValue)) {
			if (!storeProxy) {
				throw new Error("no way to serialize proxy");
			}
			const arg = new Argument.ProxyValue();
			arg.setId(storeProxy(currentValue));
			message.setProxy(arg);
		} else if (currentValue instanceof Date
			|| (currentValue && typeof currentValue.getTime === "function")) {
			const arg = new Argument.DateValue();
			arg.setDate(currentValue.toString());
			message.setDate(arg);
		} else if (currentValue !== null && typeof currentValue === "object") {
			const arg = new Argument.ObjectValue();
			const map = arg.getDataMap();
			Object.keys(currentValue).forEach((key) => {
				map.set(key, convert(currentValue[key]));
			});
			message.setObject(arg);
		} else if (currentValue === null) {
			message.setNull(new Argument.NullValue());
		} else {
			switch (typeof currentValue) {
				case "undefined":
					message.setUndefined(new Argument.UndefinedValue());
					break;
				case "function":
					if (!storeFunction) {
						throw new Error("no way to serialize function");
					}
					const arg = new Argument.FunctionValue();
					arg.setId(storeFunction(currentValue));
					message.setFunction(arg);
					break;
				case "number":
					message.setNumber(currentValue);
					break;
				case "string":
					message.setString(currentValue);
					break;
				case "boolean":
					message.setBoolean(currentValue);
					break;
				default:
					throw new Error(`cannot convert ${typeof currentValue} to proto`);
			}
		}

		return message;
	};

	return convert(value);
};

/**
 * Convert proto to an argument.
 * If running a remote callback is supported, provide `runCallback`.
 * If using a remote proxy is supported, provide `createProxy`.
 */
export const protoToArgument = (
	message?: Argument,
	runCallback?: (id: number, args: any[]) => void,
	createProxy?: (id: number) => ServerProxy,
): any => {
	const convert = (currentMessage: Argument): any => {
		switch (currentMessage.getMsgCase()) {
			case Argument.MsgCase.ERROR:
				const errorMessage = currentMessage.getError()!;
				const error = new Error(errorMessage.getMessage());
				(error as NodeJS.ErrnoException).code = errorMessage.getCode();
				(error as any).originalStack = errorMessage.getStack();

				return error;
			case Argument.MsgCase.BUFFER:
				return Buffer.from(currentMessage.getBuffer()!.getData() as Uint8Array);
			case Argument.MsgCase.ARRAY:
				return currentMessage.getArray()!.getDataList().map((a) => convert(a));
			case Argument.MsgCase.PROXY:
				if (!createProxy) {
					throw new Error("no way to create proxy");
				}

				return createProxy(currentMessage.getProxy()!.getId());
			case Argument.MsgCase.DATE:
				return new Date(currentMessage.getDate()!.getDate());
			case Argument.MsgCase.OBJECT:
				const obj: { [Key: string]: any } = {};
				currentMessage.getObject()!.getDataMap().forEach((argument, key) => {
					obj[key] = convert(argument);
				});

				return obj;
			case Argument.MsgCase.UNDEFINED:
				return undefined;
			case Argument.MsgCase.NULL:
				return null;
			case Argument.MsgCase.FUNCTION:
				if (!runCallback) {
					throw new Error("no way to run remote callback");
				}

				return (...args: any[]): void => {
					return runCallback(currentMessage.getFunction()!.getId(), args);
				};
			case Argument.MsgCase.NUMBER:
				return currentMessage.getNumber();
			case Argument.MsgCase.STRING:
				return currentMessage.getString();
			case Argument.MsgCase.BOOLEAN:
				return currentMessage.getBoolean();
			default:
				throw new Error("cannot convert unexpected proto to argument");
		}
	};

	return message && convert(message);
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

export const protoToOperatingSystem = (protoOp: WorkingInit.OperatingSystem): OperatingSystem => {
	switch (protoOp) {
		case WorkingInit.OperatingSystem.WINDOWS: return OperatingSystem.Windows;
		case WorkingInit.OperatingSystem.LINUX: return OperatingSystem.Linux;
		case WorkingInit.OperatingSystem.MAC: return OperatingSystem.Mac;
		default: throw new Error(`unsupported operating system ${protoOp}`);
	}
};

export const platformToProto = (platform: NodeJS.Platform): WorkingInit.OperatingSystem => {
	switch (platform) {
		case "win32": return WorkingInit.OperatingSystem.WINDOWS;
		case "linux": return WorkingInit.OperatingSystem.LINUX;
		case "darwin": return WorkingInit.OperatingSystem.MAC;
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
