import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as rimraf from "rimraf";
import * as util from "util";
import { IDisposable } from "@coder/disposable";
import { Emitter } from "@coder/events";
import { Client } from "../src/browser/client";
import { Server, ServerOptions } from "../src/node/server";

// So we only make the directory once when running multiple tests.
let mkdirPromise: Promise<void> | undefined;

export class Helper {
	private i = 0;
	public coderDir: string;
	private baseDir = path.join(os.tmpdir(), "coder");

	public constructor(directoryName: string) {
		if (!directoryName.trim()) {
			throw new Error("no directory name");
		}

		this.coderDir = path.join(this.baseDir, directoryName);
	}

	public tmpFile(): string {
		return path.join(this.coderDir, `${this.i++}`);
	}

	public async createTmpFile(): Promise<string> {
		const tf = this.tmpFile();
		await util.promisify(fs.writeFile)(tf, "");

		return tf;
	}

	public async prepare(): Promise<void> {
		if (!mkdirPromise) {
			mkdirPromise = util.promisify(fs.mkdir)(this.baseDir).catch((error) => {
				if (error.code !== "EEXIST" && error.code !== "EISDIR") {
					throw error;
				}
			});
		}
		await mkdirPromise;
		await util.promisify(rimraf)(this.coderDir);
		await util.promisify(fs.mkdir)(this.coderDir);
	}
}

export const createClient = (serverOptions?: ServerOptions): Client => {
	const s2c = new Emitter<Uint8Array | Buffer>();
	const c2s = new Emitter<Uint8Array | Buffer>();
	const closeCallbacks = <Array<() => void>>[];

	// tslint:disable-next-line no-unused-expression
	new Server({
		close: (): void => closeCallbacks.forEach((cb) => cb()),
		onDown: (_cb: () => void): void => undefined,
		onUp: (_cb: () => void): void => undefined,
		onClose: (cb: () => void): number => closeCallbacks.push(cb),
		onMessage: (cb): IDisposable => c2s.event((d) => cb(d)),
		send: (data): NodeJS.Timer => setTimeout(() => s2c.emit(data), 0),
	}, serverOptions);

	const client = new Client({
		close: (): void => closeCallbacks.forEach((cb) => cb()),
		onDown: (_cb: () => void): void => undefined,
		onUp: (_cb: () => void): void => undefined,
		onClose: (cb: () => void): number => closeCallbacks.push(cb),
		onMessage: (cb): IDisposable => s2c.event((d) => cb(d)),
		send: (data): NodeJS.Timer => setTimeout(() => c2s.emit(data), 0),
	});

	return client;
};
