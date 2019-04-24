import { EventEmitter } from "events";
import * as stream from "stream";
import { ServerProxy } from "../../common/proxy";

// tslint:disable completed-docs no-any

export class WritableProxy<T extends stream.Writable = stream.Writable> extends ServerProxy<T> {
	public constructor(instance: T, bindEvents: string[] = [], delayedEvents?: string[]) {
		super({
			bindEvents: ["close", "drain", "error", "finish"].concat(bindEvents),
			doneEvents: ["close"],
			delayedEvents,
			instance,
		});
	}

	public async destroy(): Promise<void> {
		this.instance.destroy();
	}

	public async end(data?: any, encoding?: string): Promise<void> {
		return new Promise((resolve): void => {
			this.instance.end(data, encoding, () => {
				resolve();
			});
		});
	}

	public async setDefaultEncoding(encoding: string): Promise<void> {
		this.instance.setDefaultEncoding(encoding);
	}

	public async write(data: any, encoding?: string): Promise<void> {
		return new Promise((resolve, reject): void => {
			this.instance.write(data, encoding, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	public async dispose(): Promise<void> {
		this.instance.end();
		await super.dispose();
	}
}

/**
 * This noise is because we can't do multiple extends and we also can't seem to
 * do `extends WritableProxy<T> implement ReadableProxy<T>` (for `DuplexProxy`).
 */
export interface IReadableProxy<T extends EventEmitter> extends ServerProxy<T> {
	pipe<P extends WritableProxy>(destination: P, options?: { end?: boolean; }): Promise<void>;
	setEncoding(encoding: string): Promise<void>;
}

export class ReadableProxy<T extends stream.Readable = stream.Readable> extends ServerProxy<T> implements IReadableProxy<T> {
	public constructor(instance: T, bindEvents: string[] = []) {
		super({
			bindEvents: ["close", "end", "error"].concat(bindEvents),
			doneEvents: ["close"],
			delayedEvents: ["data"],
			instance,
		});
	}

	public async pipe<P extends WritableProxy>(destination: P, options?: { end?: boolean; }): Promise<void> {
		this.instance.pipe(destination.instance, options);
		// `pipe` switches the stream to flowing mode and makes data start emitting.
		await this.bindDelayedEvent("data");
	}

	public async destroy(): Promise<void> {
		this.instance.destroy();
	}

	public async setEncoding(encoding: string): Promise<void> {
		this.instance.setEncoding(encoding);
	}

	public async dispose(): Promise<void> {
		this.instance.destroy();
		await super.dispose();
	}
}

export class DuplexProxy<T extends stream.Duplex = stream.Duplex> extends WritableProxy<T> implements IReadableProxy<T> {
	public constructor(stream: T, bindEvents: string[] = []) {
		super(stream, ["end"].concat(bindEvents), ["data"]);
	}

	public async pipe<P extends WritableProxy>(destination: P, options?: { end?: boolean; }): Promise<void> {
		this.instance.pipe(destination.instance, options);
		// `pipe` switches the stream to flowing mode and makes data start emitting.
		await this.bindDelayedEvent("data");
	}

	public async setEncoding(encoding: string): Promise<void> {
		this.instance.setEncoding(encoding);
	}

	public async dispose(): Promise<void> {
		this.instance.destroy();
		await super.dispose();
	}
}
