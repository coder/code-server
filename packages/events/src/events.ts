import { IDisposable } from "@coder/disposable";

export interface Event<T> {
	(listener: (e: T) => void): IDisposable;
}

/**
 * Emitter typecasts for a single event type.
 */
export class Emitter<T> {
	private listeners = <Array<(e: T) => void>>[];

	public get event(): Event<T> {
		return (cb: (e: T) => void): IDisposable => {
			if (this.listeners) {
				this.listeners.push(cb);
			}

			return {
				dispose: (): void => {
					if (this.listeners) {
						const i = this.listeners.indexOf(cb);
						if (i !== -1) {
							this.listeners.splice(i, 1);
						}
					}
				},
			};
		};
	}

	/**
	 * Emit an event with a value.
	 */
	public emit(value: T): void {
		if (this.listeners) {
			this.listeners.forEach((t) => t(value));
		}
	}

	/**
	 * Dispose the current events.
	 */
	public dispose(): void {
		this.listeners = [];
	}
}
