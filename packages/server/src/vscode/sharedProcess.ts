import { ChildProcess } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { forkModule } from "./bootstrapFork";
import { StdioIpcHandler } from "../ipc";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { LogLevel } from "vs/platform/log/common/log";
import { Emitter, Event } from '@coder/events/src';

export enum SharedProcessState {
	Stopped,
	Starting,
	Ready,
}

export type SharedProcessEvent = {
	readonly state: SharedProcessState.Ready | SharedProcessState.Starting;
} | {
	readonly state: SharedProcessState.Stopped;
	readonly error: string;
};

export class SharedProcess {

	public readonly socketPath: string = path.join(os.tmpdir(), `.vscode-online${Math.random().toString()}`);
	private _state: SharedProcessState = SharedProcessState.Stopped;
	private activeProcess: ChildProcess | undefined;
	private ipcHandler: StdioIpcHandler | undefined;
	private readonly onStateEmitter: Emitter<SharedProcessEvent>;

	public constructor(
		private readonly userDataDir: string,
	) {
		this.onStateEmitter = new Emitter();
		this.restart();
	}

	public get onState(): Event<SharedProcessEvent> {
		return this.onStateEmitter.event;
	}

	public get state(): SharedProcessState {
		return this._state;
	}

	public restart(): void {
		if (this.activeProcess && !this.activeProcess.killed) {
			this.activeProcess.kill();
		}

		const extensionsDir = path.join(this.userDataDir, "extensions");
		const mkdir = (dir: string): void => {
			try {
				fs.mkdirSync(dir);
			} catch (ex) {
				if (ex.code !== "EEXIST") {
					throw ex;
				}
			}
		};
		mkdir(this.userDataDir);
		mkdir(extensionsDir);

		this.setState({
			state: SharedProcessState.Starting,
		});
		let resolved: boolean = false;
		this.activeProcess = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain", {
			VSCODE_ALLOW_IO: "true",
		});
		this.activeProcess.on("exit", (err) => {
			if (this._state !== SharedProcessState.Stopped) {
				this.setState({
					error: `Exited with ${err}`,
					state: SharedProcessState.Stopped,
				});
			}
			this.restart();
		});
		this.ipcHandler = new StdioIpcHandler(this.activeProcess);
		this.ipcHandler.once("handshake:hello", () => {
			const data: {
				sharedIPCHandle: string;
				args: ParsedArgs;
				logLevel: LogLevel;
			} = {
				args: {
					"builtin-extensions-dir": path.join(process.env.BUILD_DIR || path.join(__dirname, "../.."), "build/extensions"),
					"user-data-dir": this.userDataDir,
					"extensions-dir": extensionsDir,
				} as any,
				logLevel: 0,
				sharedIPCHandle: this.socketPath,
			};
			this.ipcHandler!.send("handshake:hey there", "", data);
		});
		this.ipcHandler.once("handshake:im ready", () => {
			resolved = true;
			this.setState({
				state: SharedProcessState.Ready,
			});
		});
		this.activeProcess.stderr.on("data", (data) => {
			if (!resolved) {
				this.setState({
					error: data.toString(),
					state: SharedProcessState.Stopped,
				});
				if (!this.activeProcess) {
					return;
				}
				this.activeProcess.kill();
			}
		});
	}

	public dispose(): void {
		if (this.ipcHandler) {
			this.ipcHandler.send("handshake:goodbye");
		}
		this.ipcHandler = undefined;
	}

	private setState(event: SharedProcessEvent): void {
		this._state = event.state;
		this.onStateEmitter.emit(event);
	}
}
