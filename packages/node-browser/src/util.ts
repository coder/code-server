// The type doesn't matter for these since we're just throwing.
// tslint:disable no-any
export const throwUnimplementedError = (): any => {
	throw new Error("not implemented");
};
// In case the types except the promisify property.
throwUnimplementedError.__promisify__ = undefined as any;
// This one seems to be a mistake in the types for `link`.
throwUnimplementedError.link = undefined as any;
export const throwSyncError = (): any => {
	throw new Error("sync is not supported");
};
// realpath & realpathSync.
throwSyncError.native = undefined as any;
// tslint:enable no-any

/**
 * Return true if the options specify to use a Buffer instead of string.
 */
export const useBuffer = (options: { encoding?: string | null } | string | undefined | null | Function): boolean => {
	return options === "buffer"
		|| (!!options && typeof options !== "string" && typeof options !== "function"
				&& (options.encoding === "buffer" || options.encoding === null));
};

/**
 * Run a command with bash.
 */
export const bashCommand = (command: string): string => {
	return `bash -c "${command.replace(/"/g, "\\\"")}"`;
};

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

/**
 * This queues up items then runs on all the items at once after a timeout. Each
 * item has a callback that expects the response for that item which is the
 * extending class's responsibility to call.
 *
 * You can also specify a maximum number of items to keep in the queue.
 */
export abstract class Queue<T> {

	private items: Map<string, T[]>;
	private timeout: number | NodeJS.Timer | undefined;
	private max: number | undefined;
	private timeoutDelay = 1;

	public constructor(max?: number) {
		this.items = new Map();
		this.max = max;
	}

	/**
	 * Add an item to the queue.
	 */
	public add(key: string, callback: T): void {
		if (this.items.has(key)) {
			this.items.get(key)!.push(callback);
		} else {
			this.items.set(key, [callback]);
		}

		const run = (): void => {
			// tslint:disable-next-line no-any because NodeJS.Timer is valid.
			clearTimeout(this.timeout as any);
			this.timeout = undefined;
			const newMap = new Map(this.items);
			this.items.clear();
			this.run(newMap);
		};

		if (typeof this.max !== "undefined" && this.items.size >= this.max) {
			return run();
		}

		if (typeof this.timeout === "undefined") {
			this.timeout = setTimeout(() => {
				run();
			}, this.timeoutDelay);
		}
	}

	/**
	 * Run on the specified items then call their callbacks.
	 */
	protected abstract run(items: Map<string, T[]>): void;

}

/**
 * Class for safely taking input and turning it into separate messages.
 * Assumes that messages are split by newlines.
 */
export class NewlineInputBuffer {

	private callback: (msg: string) => void;
	private buffer: string | undefined;

	public constructor(callback: (msg: string) => void) {
		this.callback = callback;
	}

	/**
	 * Add data to be buffered.
	 */
	public push(data: string | Uint8Array): void {
		let input = typeof data === "string" ? data : data.toString();
		if (this.buffer) {
			input = this.buffer + input;
			this.buffer = undefined;
		}
		const lines = input.split("\n");
		const length = lines.length - 1;
		const lastLine = lines[length];
		if (lastLine.length > 0) {
			this.buffer = lastLine;
		}
		lines.pop(); // This is either the line we buffered or an empty string.
		for (let i = 0; i < length; ++i) {
			this.callback(lines[i]);
		}
	}

}
