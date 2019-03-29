import { ChildProcess } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { forkModule } from "./bootstrapFork";
import { StdioIpcHandler } from "../ipc";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { Emitter } from "@coder/events/src";
import { retry } from "@coder/ide/src/retry";
import { logger, field, Level } from "@coder/logger";

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
	public readonly socketPath: string = os.platform() === "win32" ? path.join("\\\\?\\pipe", os.tmpdir(), `.code-server${Math.random().toString()}`) : path.join(os.tmpdir(), `.code-server${Math.random().toString()}`);
	private _state: SharedProcessState = SharedProcessState.Stopped;
	private activeProcess: ChildProcess | undefined;
	private ipcHandler: StdioIpcHandler | undefined;
	private readonly onStateEmitter = new Emitter<SharedProcessEvent>();
	public readonly onState = this.onStateEmitter.event;
	private readonly retryName = "Shared process";
	private readonly logger = logger.named("shared");

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
				if (ex.code !== "EEXIST" && ex.code !== "EISDIR") {
					throw ex;
				}
			}
		};
		mkdir(this.userDataDir);
		mkdir(extensionsDir);
		const backupsDir = path.join(this.userDataDir, "Backups");
		mkdir(backupsDir);
		const workspacesFile = path.join(backupsDir, "workspaces.json");
		if (!fs.existsSync(workspacesFile)) {
			fs.closeSync(fs.openSync(workspacesFile, "w"));
		}

		this.setState({
			state: SharedProcessState.Starting,
		});
		let resolved: boolean = false;
		const maybeStop = (error: string): void => {
			if (resolved) {
				return;
			}
			this.setState({
				error,
				state: SharedProcessState.Stopped,
			});
			if (!this.activeProcess) {
				return;
			}
			this.activeProcess.kill();
		};
		this.activeProcess = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain", [], {
			env: {
				VSCODE_ALLOW_IO: "true",
				VSCODE_LOGS: process.env.VSCODE_LOGS,
			},
		}, this.userDataDir);
		if (this.logger.level <= Level.Trace) {
			this.activeProcess.stdout.on("data", (data) => {
				this.logger.trace(() => ["stdout", field("data", data.toString())]);
			});
		}
		this.activeProcess.on("error", (error) => {
			this.logger.error("error", field("error", error));
			maybeStop(error.message);
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
			const data: {
				sharedIPCHandle: string;
				args: Partial<ParsedArgs>;
				logLevel: Level;
			} = {
				args: {
					"builtin-extensions-dir": this.builtInExtensionsDir,
					"user-data-dir": this.userDataDir,
					"extensions-dir": extensionsDir,
				},
				logLevel: this.logger.level,
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
			this.logger.error("stderr", field("data", data.toString()));
			maybeStop(data.toString());
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
