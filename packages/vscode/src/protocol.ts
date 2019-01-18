import { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { Protocol as VSProtocol } from "vs/base/parts/ipc/node/ipc.net";
import { LogLevel } from "vs/platform/log/common/log";

export interface ISharedProcessInitData {
	socketPath: string;
	serviceUrl: string;
	logsDir: string;
	windowId: number;
	logLevel: LogLevel;
}

export interface IStdio {
	onMessage: (cb: (data: string | Buffer) => void) => void;
	sendMessage: (data: string | Buffer) => void;
	onExit?: (cb: () => void) => void;
}

/**
 * An implementation of net.Socket that uses stdio streams.
 */
class Socket {

	private readonly emitter: EventEmitter;

	public constructor(private readonly stdio: IStdio, ignoreFirst: boolean = false) {
		this.emitter = new EventEmitter();

		let first = true;
		stdio.onMessage((data) => {
			if (ignoreFirst && first) {
				first = false;

				return;
			}
			this.emitter.emit("data", Buffer.from(data.toString()));
		});
		if (stdio.onExit) {
			stdio.onExit(() => {
				this.emitter.emit("close");
			});
		}
	}

	public removeListener(event: string, listener: () => void): void {
		this.emitter.removeListener(event, listener);
	}

	public once(event: string, listener: () => void): void {
		this.emitter.once(event, listener);
	}

	public on(event: string, listener: () => void): void {
		this.emitter.on(event, listener);
	}

	public end(): void {
		// TODO: figure it out
	}

	public get destroyed(): boolean {
		return false;
	}

	public write(data: string | Buffer): void {
		this.stdio.sendMessage(data);
	}

}

/**
 * A protocol around a process, stream, or worker.
 */
export class Protocol extends VSProtocol {

	public static fromProcess(childProcess: ChildProcess): Protocol {
		return Protocol.fromStdio({
			onMessage: (cb): void => {
				childProcess.stdout.on("data", (data: string | Buffer) => {
					cb(data);
				});
			},
			sendMessage: (data): void => {
				childProcess.stdin.write(data);
			},
			onExit: (cb): void => {
				childProcess.on("exit", cb);
			},
		});
	}

	public static fromStream(
		inStream: { on: (event: "data", cb: (b: string | Buffer) => void) => void },
		outStream: { write: (b: string | Buffer) => void },
	): Protocol {
		return Protocol.fromStdio({
			onMessage: (cb): void => {
				inStream.on("data", (data) => {
					cb(data);
				});
			},
			sendMessage: (data): void => {
				outStream.write(data);
			},
		});
	}

	public static fromWorker(worker: {
		onmessage: (event: MessageEvent) => void;
		postMessage: (data: string, origin?: string | string[]) => void;
	}, ignoreFirst: boolean = false): Protocol {
		return Protocol.fromStdio({
			onMessage: (cb): void => {
				worker.onmessage = (event: MessageEvent): void => {
					cb(event.data);
				};
			},
			sendMessage: (data): void => {
				worker.postMessage(data.toString());
			},
		}, ignoreFirst);
	}

	public static fromStdio(stdio: IStdio, ignoreFirst?: boolean): Protocol {
		return new Protocol(new Socket(stdio, ignoreFirst));
	}

}
