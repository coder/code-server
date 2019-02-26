interface EvalHelper { }
interface ActiveEvalEmitter {
	removeAllListeners(event?: string): void;
	emit(event: string, ...args: any[]): void;
	on(event: string, cb: (...args: any[]) => void): void;
}
interface Disposer {
	onDidDispose: (cb: () => void) => void;
	dispose(): void;
}
interface IdeApi {
	readonly client: {
		run(func: (helper: ActiveEvalEmitter) => Disposer): ActiveEvalEmitter;
		run<T1>(func: (helper: ActiveEvalEmitter, a1: T1) => Disposer, a1: T1): ActiveEvalEmitter;
		run<T1, T2>(func: (helper: ActiveEvalEmitter, a1: T1, a2: T2) => Disposer, a1: T1, a2: T2): ActiveEvalEmitter;
		run<T1, T2, T3>(func: (helper: ActiveEvalEmitter, a1: T1, a2: T2, a3: T3) => Disposer, a1: T1, a2: T2, a3: T3): ActiveEvalEmitter;
		run<T1, T2, T3, T4>(func: (helper: ActiveEvalEmitter, a1: T1, a2: T2, a3: T3, a4: T4) => Disposer, a1: T1, a2: T2, a3: T3, a4: T4): ActiveEvalEmitter;
		run<T1, T2, T3, T4, T5>(func: (helper: ActiveEvalEmitter, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => Disposer, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): ActiveEvalEmitter;
		run<T1, T2, T3, T4, T5, T6>(func: (helper: ActiveEvalEmitter, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => Disposer, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): ActiveEvalEmitter;

		evaluate<R>(func: (helper: EvalHelper) => R | Promise<R>): Promise<R>;
		evaluate<R, T1>(func: (helper: EvalHelper, a1: T1) => R | Promise<R>, a1: T1): Promise<R>;
		evaluate<R, T1, T2>(func: (helper: EvalHelper, a1: T1, a2: T2) => R | Promise<R>, a1: T1, a2: T2): Promise<R>;
		evaluate<R, T1, T2, T3>(func: (helper: EvalHelper, a1: T1, a2: T2, a3: T3) => R | Promise<R>, a1: T1, a2: T2, a3: T3): Promise<R>;
		evaluate<R, T1, T2, T3, T4>(func: (helper: EvalHelper, a1: T1, a2: T2, a3: T3, a4: T4) => R | Promise<R>, a1: T1, a2: T2, a3: T3, a4: T4): Promise<R>;
		evaluate<R, T1, T2, T3, T4, T5>(func: (helper: EvalHelper, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R | Promise<R>, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): Promise<R>;
		evaluate<R, T1, T2, T3, T4, T5, T6>(func: (helper: EvalHelper, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R | Promise<R>, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): Promise<R>;
	};
	readonly workbench: {
		getService<T>(identifier: any): T | undefined;
	};
}

declare interface Window {
	ide?: IdeApi;

	addEventListener(event: "ide-ready", callback: (ide: CustomEvent & { readonly ide: IdeApi }) => void): void;
}