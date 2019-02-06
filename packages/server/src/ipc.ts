import { EventEmitter } from "events";
import { ChildProcess } from "child_process";

export interface IpcMessage {
	readonly event: string;
	readonly args: any[];
}

export class StdioIpcHandler extends EventEmitter {
	private isListening: boolean = false;

	public constructor(
		private readonly childProcess?: ChildProcess,
	) {
		super();
	}

	public on(event: string, cb: (...args: any[]) => void): this {
		this.listen();
		return super.on(event, cb);
	}

	public once(event: string, cb: (...args: any[]) => void): this {
		this.listen();
		return super.once(event, cb);
	}

	public addListener(event: string, cb: (...args: any[]) => void): this {
		this.listen();
		return super.addListener(event, cb);
	}

	public send(event: string, ...args: any[]): void {
		const msg: IpcMessage = {
			event,
			args,
		};
		const d = JSON.stringify(msg);
		if (this.childProcess) {
			this.childProcess.stdin.write(d + "\n");
		} else {
			process.stdout.write(d);
		}
	}

	private listen(): void {
		if (this.isListening) {
			return;
		}
		const onData = (data: any) => {
			try {
				const d = JSON.parse(data.toString()) as IpcMessage;
				this.emit(d.event, ...d.args);
			} catch (ex) {
				if (!this.childProcess) {
					process.stderr.write(`Failed to parse incoming data: ${ex.message}`);
				}
			}
		};
		if (this.childProcess) {
			this.childProcess.stdout.resume();
			this.childProcess.stdout.on("data", onData);
		} else {
			process.stdin.resume();
			process.stdin.on("data", onData);
		}
	}
}
