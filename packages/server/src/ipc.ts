import { EventEmitter } from "events";
import { ChildProcess } from "child_process";

// tslint:disable no-any

export interface IpcMessage {
	readonly event: string;
	readonly args: any[];
}

/**
 *  Implement Electron-style IPC for a forked process.
 */
export class IpcHandler extends EventEmitter {
	public constructor(private readonly childProcess?: ChildProcess) {
		super();
		(this.childProcess || process).on("message", (message: IpcMessage): void => {
			this.emit(message.event, ...message.args);
		});
	}

	public send(event: string, ...args: any[]): void {
		(this.childProcess || process).send!({ event, args });
	}
}
