import * as stream from "stream";
import { ServerProxy } from "../../common/proxy";

// tslint:disable completed-docs

export class WritableProxy<T extends stream.Writable = stream.Writable> implements ServerProxy {
	public constructor(protected readonly stream: T) {}

	public async destroy(): Promise<void> {
		this.stream.destroy();
	}

	// tslint:disable-next-line no-any
	public async end(data?: any, encoding?: string): Promise<void> {
		return new Promise((resolve): void => {
			this.stream.end(data, encoding, () => {
				resolve();
			});
		});
	}

	public async setDefaultEncoding(encoding: string): Promise<void> {
		this.stream.setDefaultEncoding(encoding);
	}

	// tslint:disable-next-line no-any
	public async write(data: any, encoding?: string): Promise<void> {
		return new Promise((resolve, reject): void => {
			this.stream.write(data, encoding, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	public async dispose(): Promise<void> {
		this.stream.end();
		this.stream.removeAllListeners();
	}

	public async onDone(cb: () => void): Promise<void> {
		this.stream.on("close", cb);
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		// Sockets have an extra argument on "close".
		// tslint:disable-next-line no-any
		this.stream.on("close", (...args: any[]) => cb("close", ...args));
		this.stream.on("drain", () => cb("drain"));
		this.stream.on("error", (error) => cb("error", error));
		this.stream.on("finish", () => cb("finish"));
	}
}

/**
 * This noise is because we can't do multiple extends and we also can't seem to
 * do `extends WritableProxy<T> implement ReadableProxy<T>` (for `DuplexProxy`).
 */
export interface IReadableProxy extends ServerProxy {
	destroy(): Promise<void>;
	setEncoding(encoding: string): Promise<void>;
	dispose(): Promise<void>;
	onDone(cb: () => void): Promise<void>;
}

export class ReadableProxy<T extends stream.Readable = stream.Readable> implements IReadableProxy {
	public constructor(protected readonly stream: T) {}

	public async destroy(): Promise<void> {
		this.stream.destroy();
	}

	public async setEncoding(encoding: string): Promise<void> {
		this.stream.setEncoding(encoding);
	}

	public async dispose(): Promise<void> {
		this.stream.destroy();
	}

	public async onDone(cb: () => void): Promise<void> {
		this.stream.on("close", cb);
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		this.stream.on("close", () => cb("close"));
		this.stream.on("data", (chunk) => cb("data", chunk));
		this.stream.on("end", () => cb("end"));
		this.stream.on("error", (error) => cb("error", error));
	}
}

export class DuplexProxy<T extends stream.Duplex = stream.Duplex> extends WritableProxy<T> implements IReadableProxy {
	public async setEncoding(encoding: string): Promise<void> {
		this.stream.setEncoding(encoding);
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		await super.onEvent(cb);
		this.stream.on("data", (chunk) => cb("data", chunk));
		this.stream.on("end", () => cb("end"));
	}
}
