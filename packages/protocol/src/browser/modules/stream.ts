import * as stream from "stream";
import { callbackify } from "util";
import { ClientProxy } from "../../common/proxy";
import { DuplexProxy, IReadableProxy, WritableProxy } from "../../node/modules/stream";

// tslint:disable completed-docs

export class Writable<T extends WritableProxy = WritableProxy> extends ClientProxy<T> implements stream.Writable {
	public get writable(): boolean {
		throw new Error("not implemented");
	}

	public get writableHighWaterMark(): number {
		throw new Error("not implemented");
	}

	public get writableLength(): number {
		throw new Error("not implemented");
	}

	public _write(): void {
		throw new Error("not implemented");
	}

	public _destroy(): void {
		throw new Error("not implemented");
	}

	public _final(): void {
		throw new Error("not implemented");
	}

	public pipe<T>(): T {
		throw new Error("not implemented");
	}

	public cork(): void {
		throw new Error("not implemented");
	}

	public uncork(): void {
		throw new Error("not implemented");
	}

	public destroy(): void {
		this.catch(this.proxy.destroy());
	}

	public setDefaultEncoding(encoding: string): this {
		return this.catch(this.proxy.setDefaultEncoding(encoding));
	}

	// tslint:disable-next-line no-any
	public write(chunk: any, encoding?: string | ((error?: Error | null) => void), callback?: (error?: Error | null) => void): boolean {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		callbackify(this.proxy.write)(chunk, encoding, (error) => {
			if (callback) {
				callback(error);
			}
		});

		return true; // Always true since we can't get this synchronously.
	}

	// tslint:disable-next-line no-any
	public end(data?: any | (() => void), encoding?: string | (() => void), callback?: (() => void)): void {
		if (typeof data === "function") {
			callback = data;
			data = undefined;
		}
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		callbackify(this.proxy.end)(data, encoding, () => {
			if (callback) {
				callback();
			}
		});
	}

	protected handleDisconnect(): void {
		this.emit("close");
		this.emit("finish");
	}
}

export class Readable<T extends IReadableProxy = IReadableProxy> extends ClientProxy<T> implements stream.Readable {
	public get readable(): boolean {
		throw new Error("not implemented");
	}

	public get readableHighWaterMark(): number {
		throw new Error("not implemented");
	}

	public get readableLength(): number {
		throw new Error("not implemented");
	}

	public _read(): void {
		throw new Error("not implemented");
	}

	public read(): void {
		throw new Error("not implemented");
	}

	public _destroy(): void {
		throw new Error("not implemented");
	}

	public unpipe(): this {
		throw new Error("not implemented");
	}

	public pause(): this {
		throw new Error("not implemented");
	}

	public resume(): this {
		throw new Error("not implemented");
	}

	public isPaused(): boolean {
		throw new Error("not implemented");
	}

	public wrap(): this {
		throw new Error("not implemented");
	}

	public push(): boolean {
		throw new Error("not implemented");
	}

	public unshift(): void {
		throw new Error("not implemented");
	}

	public pipe<T>(): T {
		throw new Error("not implemented");
	}

	// tslint:disable-next-line no-any
	public [Symbol.asyncIterator](): AsyncIterableIterator<any> {
		throw new Error("not implemented");
	}

	public destroy(): void {
		this.catch(this.proxy.destroy());
	}

	public setEncoding(encoding: string): this {
		return this.catch(this.proxy.setEncoding(encoding));
	}

	protected handleDisconnect(): void {
		this.emit("close");
		this.emit("end");
	}
}

export class Duplex<T extends DuplexProxy = DuplexProxy> extends Writable<T> implements stream.Duplex, stream.Readable {
	private readonly _readable: Readable;

	public constructor(proxyPromise: Promise<T> | T) {
		super(proxyPromise);
		this._readable = new Readable(proxyPromise, false);
	}

	public get readable(): boolean {
		return this._readable.readable;
	}

	public get readableHighWaterMark(): number {
		return this._readable.readableHighWaterMark;
	}

	public get readableLength(): number {
		return this._readable.readableLength;
	}

	public _read(): void {
		this._readable._read();
	}

	public read(): void {
		this._readable.read();
	}

	public unpipe(): this {
		this._readable.unpipe();

		return this;
	}

	public pause(): this {
		this._readable.unpipe();

		return this;
	}

	public resume(): this {
		this._readable.resume();

		return this;
	}

	public isPaused(): boolean {
		return this._readable.isPaused();
	}

	public wrap(): this {
		this._readable.wrap();

		return this;
	}

	public push(): boolean {
		return this._readable.push();
	}

	public unshift(): void {
		this._readable.unshift();
	}

	// tslint:disable-next-line no-any
	public [Symbol.asyncIterator](): AsyncIterableIterator<any> {
		return this._readable[Symbol.asyncIterator]();
	}

	public setEncoding(encoding: string): this {
		return this.catch(this.proxy.setEncoding(encoding));
	}

	protected handleDisconnect(): void {
		super.handleDisconnect();
		this.emit("end");
	}
}
