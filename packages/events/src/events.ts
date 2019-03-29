import { IDisposable } from "@coder/disposable";

export interface Event<T> {
	(listener: (value: T) => void): IDisposable;
	(id: number | string, listener: (value: T) => void): IDisposable;
}

/**
 * Emitter typecasts for a single event type. You can optionally use IDs, but
 * using undefined with IDs will not work. If you emit without an ID, *all*
 * listeners regardless of their ID (or lack thereof) will receive the event.
 * Similarly, if you listen without an ID you will get *all* events for any or
 * no ID.
 */
export class Emitter<T> {
	private listeners = <Array<(value: T) => void>>[];
	private readonly idListeners = new Map<number | string, Array<(value: T) => void>>();

	public get event(): Event<T> {
		return (id: number | string | ((value: T) => void), cb?: (value: T) => void): IDisposable => {
			if (typeof id !== "function") {
				if (this.idListeners.has(id)) {
					this.idListeners.get(id)!.push(cb!);
				} else {
					this.idListeners.set(id, [cb!]);
				}

				return {
					dispose: (): void => {
						if (this.idListeners.has(id)) {
							const cbs = this.idListeners.get(id)!;
							const i = cbs.indexOf(cb!);
							if (i !== -1) {
								cbs.splice(i, 1);
							}
						}
					},
				};
			}

			cb = id;
			this.listeners.push(cb);

			return {
				dispose: (): void => {
					const i = this.listeners.indexOf(cb!);
					if (i !== -1) {
						this.listeners.splice(i, 1);
					}
				},
			};
		};
	}

	/**
	 * Emit an event with a value.
	 */
	public emit(value: T): void;
	public emit(id: number | string, value: T): void;
	public emit(id: number | string | T, value?: T): void {
		if ((typeof id === "number" || typeof id === "string") && typeof value !== "undefined") {
			if (this.idListeners.has(id)) {
				this.idListeners.get(id)!.forEach((cb) => cb(value!));
			}
			this.listeners.forEach((cb) => cb(value!));
		} else {
			this.idListeners.forEach((cbs) => cbs.forEach((cb) => cb((id as T)!)));
			this.listeners.forEach((cb) => cb((id as T)!));
		}
	}

	/**
	 * Dispose the current events.
	 */
	public dispose(): void;
	public dispose(id: number | string): void;
	public dispose(id?: number | string): void {
		if (typeof id !== "undefined") {
			this.idListeners.delete(id);
		} else {
			this.listeners = [];
			this.idListeners.clear();
		}
	}

	public get counts(): { [key: string]: number } {
		const counts = <{ [key: string]: number }>{};
		if (this.listeners.length > 0) {
			counts["n/a"] = this.listeners.length;
		}
		this.idListeners.forEach((cbs, id) => {
			if (cbs.length > 0) {
				counts[`${id}`] = cbs.length;
			}
		});

		return counts;
	}
}
