import { EventEmitter } from "events";
import { Writable } from "stream";
import { callbackify } from "util";
import { WriteStreamProxy } from "../../common/proxy";

// `any` is used to match the stream interface.
// tslint:disable no-any

export class WritableStream extends EventEmitter implements Writable {
	public constructor(protected readonly writeStreamProxy: WriteStreamProxy) {
		super();
		this.writeStreamProxy.on("close", () => this.emit("close"));
		this.writeStreamProxy.on("drain", () => this.emit("drain"));
		this.writeStreamProxy.on("error", (error) => this.emit("error", error));
		this.writeStreamProxy.on("finish", () => this.emit("finish"));
	}

	public get writable(): boolean { throw new Error("not implemented"); }
	public get writableHighWaterMark(): number { throw new Error("not implemented"); }
	public get writableLength(): number { throw new Error("not implemented"); }
	public _write(): void { throw new Error("not implemented"); }
	public _destroy(): void { throw new Error("not implemented"); }
	public _final(): void { throw new Error("not implemented"); }
	public pipe<T>(): T { throw new Error("not implemented"); }
	public cork(): void { throw new Error("not implemented"); }
	public uncork(): void { throw new Error("not implemented"); }

	public destroy(): void {
		this.writeStreamProxy.destroy();
	}

	public setDefaultEncoding(encoding: string): this {
		this.writeStreamProxy.setDefaultEncoding(encoding);

		return this;
	}

	public write(chunk: any, encoding?: string | ((error?: Error | null) => void), callback?: (error?: Error | null) => void): boolean {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		callbackify(this.writeStreamProxy.write)(chunk, encoding, (error) => {
			if (callback) {
				callback(error);
			}
		});

		// Always true since we can't get this synchronously.
		return true;
	}

	public end(data?: any | (() => void), encoding?: string | (() => void), callback?: (() => void)): void {
		if (typeof data === "function") {
			callback = data;
			data = undefined;
		}
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		callbackify(this.writeStreamProxy.end)(data, encoding, () => {
			if (callback) {
				callback();
			}
		});
	}
}
