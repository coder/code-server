import { ChildProcess } from "child_process";
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
	public readonly socketPath: string = os.platform() === "win32"
		? path.join("\\\\?\\pipe", os.tmpdir(), `.code-server${Math.random().toString()}`)
		: path.join(os.tmpdir(), `.code-server${Math.random().toString()}`);
	private _state: SharedProcessState = SharedProcessState.Stopped;
	private activeProcess: ChildProcess | undefined;
	private ipcHandler: StdioIpcHandler | undefined;
	private readonly onStateEmitter = new Emitter<SharedProcessEvent>();
	public readonly onState = this.onStateEmitter.event;
	private readonly logger = logger.named("shared");
	private readonly retry = retry.register("Shared process", () => this.connect());
	private disposed: boolean = false;

	public constructor(
		private readonly userDataDir: string,
		private readonly extensionsDir: string,
		private readonly builtInExtensionsDir: string,
	) {
		this.retry.run();
	}

	public get state(): SharedProcessState {
		return this._state;
	}

	/**
	 * Signal the shared process to terminate.
	 */
	public dispose(): void {
		this.disposed = true;
		if (this.ipcHandler) {
			this.ipcHandler.send("handshake:goodbye");
		}
		this.ipcHandler = undefined;
	}

	/**
	 * Start and connect to the shared process.
	 */
	private async connect(): Promise<void> {
		this.setState({ state: SharedProcessState.Starting });
		const activeProcess = await this.restart();

		activeProcess.on("exit", (exitCode) => {
			const error = new Error(`Exited with ${exitCode}`);
			this.setState({
				error: error.message,
				state: SharedProcessState.Stopped,
			});
			if (!this.disposed) {
				this.retry.run(error);
			}
		});

		this.setState({ state: SharedProcessState.Ready });
	}

	/**
	 * Restart the shared process. Kill existing process if running. Resolve when
	 * the shared process is ready and reject when it errors or dies before being
	 * ready.
	 */
	private async restart(): Promise<ChildProcess> {
		if (this.activeProcess && !this.activeProcess.killed) {
			this.activeProcess.kill();
		}

		const activeProcess = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain", [], {
			env: {
				VSCODE_ALLOW_IO: "true",
				VSCODE_LOGS: process.env.VSCODE_LOGS,
				DISABLE_TELEMETRY: process.env.DISABLE_TELEMETRY,
			},
		}, this.userDataDir);
		this.activeProcess = activeProcess;

		await new Promise((resolve, reject): void => {
			const doReject = (error: Error | number | null): void => {
				if (error === null) {
					error = new Error("Exited unexpectedly");
				} else if (typeof error === "number") {
					error = new Error(`Exited with ${error}`);
				}
				activeProcess.removeAllListeners();
				this.setState({
					error: error.message,
					state: SharedProcessState.Stopped,
				});
				reject(error);
			};

			activeProcess.on("error", doReject);
			activeProcess.on("exit", doReject);

			activeProcess.stdout.on("data", (data) => {
				logger.trace("stdout", field("data", data.toString()));
			});

			activeProcess.stderr.on("data", (data) => {
				// Warn instead of error to prevent panic. It's unlikely stderr here is
				// about anything critical to the functioning of the editor.
				logger.warn("stderr", field("data", data.toString()));
			});

			this.ipcHandler = new StdioIpcHandler(activeProcess);
			this.ipcHandler.once("handshake:hello", () => {
				const data: {
					sharedIPCHandle: string;
					args: Partial<ParsedArgs>;
					logLevel: Level;
				} = {
					args: {
						"builtin-extensions-dir": this.builtInExtensionsDir,
						"user-data-dir": this.userDataDir,
						"extensions-dir": this.extensionsDir,
					},
					logLevel: this.logger.level,
					sharedIPCHandle: this.socketPath,
				};
				this.ipcHandler!.send("handshake:hey there", "", data);
			});
			this.ipcHandler.once("handshake:im ready", () => {
				activeProcess.removeListener("error", doReject);
				activeProcess.removeListener("exit", doReject);
				resolve();
			});
		});

		return activeProcess;
	}

	/**
	 * Set the internal shared process state and emit the state event.
	 */
	private setState(event: SharedProcessEvent): void {
		this._state = event.state;
		this.onStateEmitter.emit(event);
	}
}
