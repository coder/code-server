import * as JSZip from "jszip";
import * as path from "path";
import * as resolve from "resolve";
import { Tar } from "./tarReader";
const textDecoder = new (typeof TextDecoder === "undefined" ? require("text-encoding").TextDecoder : TextDecoder)();

export interface IFileReader {
	exists(path: string): boolean;
	read(path: string): Uint8Array;
}

/**
 * RequireFS allows users to require from a file system.
 */
export class RequireFS {
	private readonly reader: IFileReader;
	private readonly customModules: Map<string, { exports: object }>;
	private readonly requireCache: Map<string, { exports: object }>;
	private baseDir: string | undefined;

	public constructor(reader: IFileReader) {
		this.reader = reader;
		this.customModules = new Map();
		this.requireCache = new Map();
	}

	/**
	 * Add a base-directory to nest from.
	 */
	public basedir(path: string): void {
		this.baseDir = path;
	}

	/**
	 * Provide custom modules to the require instance.
	 */
	// tslint:disable-next-line:no-any
	public provide(module: string, value: any): void {
		if (this.customModules.has(module)) {
			throw new Error("custom module has already been registered with this name");
		}

		this.customModules.set(module, value);
	}

	public readFile(target: string, type?: "string"): string;
	public readFile(target: string, type?: "buffer"): Buffer;

	/**
	 * Read a file and returns its contents.
	 */
	public readFile(target: string, type?: "string" | "buffer"): string | Buffer {
		target = path.normalize(target);
		const read = this.reader.read(target);

		return type === "string" ? textDecoder.decode(read) : Buffer.from(read);
	}

	/**
	 * Require a path from a file system.
	 */
	// tslint:disable-next-line:no-any
	public require(target: string): any {
		target = path.normalize(target);

		return this.doRequire([target], `./${path.basename(target)}`);
	}

	/**
	 * Do require for a caller. Needed for resolving relative paths.
	 */
	private doRequire(callers: string[], resolvePath: string): object {
		if (this.customModules.has(resolvePath)) {
			return this.customModules.get(resolvePath)!.exports;
		}

		const caller = callers[callers.length - 1];
		const reader = this.reader;

		const newRelative = this.realizePath(caller, resolvePath);
		if (this.requireCache.has(newRelative)) {
			return this.requireCache.get(newRelative)!.exports;
		}

		const module = {
			exports: {},
		};
		this.requireCache.set(newRelative, module);

		const content = textDecoder.decode(reader.read(newRelative));
		if (newRelative.endsWith(".json")) {
			module.exports = JSON.parse(content);
		} else {
			eval("'use strict'; " + content);
		}

		return module.exports;
	}

	/**
	 * Attempts to find a module from a path
	 */
	private realizePath(caller: string, fullRelative: string): string {
		const stripPrefix = (path: string): string => {
			if (path.startsWith("/")) {
				path = path.substr(1);
			}
			if (path.endsWith("/")) {
				path = path.substr(0, path.length - 1);
			}

			return path;
		};
		const callerDirname = path.dirname(caller);
		const resolvedPath = resolve.sync(fullRelative, {
			basedir: this.baseDir ? callerDirname.startsWith(this.baseDir) ? callerDirname : path.join(this.baseDir, callerDirname) : callerDirname,
			extensions: [".js"],
			readFileSync: (file: string): string => {
				return this.readFile(stripPrefix(file));
			},
			isFile: (file: string): boolean => {
				return this.reader.exists(stripPrefix(file));
			},
		});

		return stripPrefix(resolvedPath);
	}
}

export const fromTar = (content: Uint8Array): RequireFS => {
	const tar = Tar.fromUint8Array(content);

	return new RequireFS({
		exists: (path: string): boolean => {
			return tar.files.has(path);
		},
		read: (path: string): Uint8Array => {
			const file = tar.files.get(path);
			if (!file) {
				throw new Error(`file "${path}" not found`);
			}

			return file.read();
		},
	});
};

export const fromZip = (content: Uint8Array): RequireFS => {
	const zip = new JSZip(content);

	return new RequireFS({
		exists: (fsPath: string): boolean => {
			const file = zip.file(fsPath);

			return typeof file !== "undefined" && file !== null;
		},
		read: (fsPath: string): Uint8Array => {
			const file = zip.file(fsPath);
			if (!file) {
				throw new Error(`file "${fsPath}" not found`);
			}

			// TODO: Should refactor to allow a promise.
			// tslint:disable-next-line no-any
			return zip.file(fsPath).async("uint8array") as any;
		},
	});
};
