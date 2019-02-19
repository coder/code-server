export interface ActiveEval {
	removeAllListeners(event?: string): void;

	// tslint:disable no-any
	emit(event: string, ...args: any[]): void;
	on(event: string, cb: (...args: any[]) => void): void;
	// tslint:disable no-any
}
