import { ChildProcess } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { forkModule } from "./bootstrapFork";
import { StdioIpcHandler } from "../ipc";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { LogLevel } from "vs/platform/log/common/log";
import { Emitter } from "@coder/events/src";
import { retry } from "@coder/ide/src/retry";

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
	public readonly socketPath: string = path.join(os.tmpdir(), `.vscode-remote${Math.random().toString()}`);
	private _state: SharedProcessState = SharedProcessState.Stopped;
	private activeProcess: ChildProcess | undefined;
	private ipcHandler: StdioIpcHandler | undefined;
	private readonly onStateEmitter = new Emitter<SharedProcessEvent>();
	public readonly onState = this.onStateEmitter.event;
	private readonly retryName = "Shared process";

	public constructor(
		private readonly userDataDir: string,
		private readonly builtInExtensionsDir: string,
	) {
		retry.register(this.retryName, () => this.restart());
		retry.run(this.retryName);
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
			VSCODE_LOGS: process.env.VSCODE_LOGS,
		});
		this.activeProcess.on("exit", (err) => {
			if (this._state !== SharedProcessState.Stopped) {
				this.setState({
					error: `Exited with ${err}`,
					state: SharedProcessState.Stopped,
				});
			}
			retry.run(this.retryName, new Error(`Exited with ${err}`));
		});
		this.ipcHandler = new StdioIpcHandler(this.activeProcess);
		this.ipcHandler.once("handshake:hello", () => {
			let logLevel = LogLevel.Warning;
			const envLevel = typeof global !== "undefined" && typeof global.process !== "undefined" ? global.process.env.LOG_LEVEL : process.env.LOG_LEVEL;
			if (envLevel) {
				switch (envLevel) {
					case "trace": logLevel = LogLevel.Trace; break;
					case "debug": logLevel = LogLevel.Debug; break;
					case "info": logLevel = LogLevel.Info; break;
					case "warn": logLevel = LogLevel.Warning; break;
					case "error": logLevel = LogLevel.Error; break;
					case "critical": logLevel = LogLevel.Critical; break;
					case "off": logLevel = LogLevel.Off; break;
				}
			}
			const data: {
				sharedIPCHandle: string;
				args: Partial<ParsedArgs>;
				logLevel: LogLevel;
			} = {
				args: {
					"builtin-extensions-dir": this.builtInExtensionsDir,
					"user-data-dir": this.userDataDir,
					"extensions-dir": extensionsDir,
				},
				logLevel,
				sharedIPCHandle: this.socketPath,
			};
			this.ipcHandler!.send("handshake:hey there", "", data);
		});
		this.ipcHandler.once("handshake:im ready", () => {
			resolved = true;
			retry.recover(this.retryName);
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
