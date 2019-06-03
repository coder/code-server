import { Emitter } from "@coder/events";
import { logger, Level } from "@coder/logger";
import { retry, withEnv } from "@coder/protocol";
import { fork, ChildProcess } from "child_process";
import * as os from "os";
import * as path from "path";
import { IpcHandler } from "../ipc";

// tslint:disable-next-line completed-docs pretty obvious what this is
export enum SharedProcessState {
	Stopped,
	Starting,
	Ready,
}

interface SharedProcessArgs {
	"user-data-dir"?: string;
	"extensions-dir"?: string;
	"builtin-extensions-dir"?: string;
	"extra-extension-dirs"?: string[];
	"extra-builtin-extension-dirs"?: string[];
}

export type SharedProcessEvent = {
	readonly state: SharedProcessState.Ready | SharedProcessState.Starting;
} | {
	readonly state: SharedProcessState.Stopped;
	readonly error: string;
};

/**
 * Forks the shared process and restarts it if it dies.
 */
export class SharedProcess {
	public readonly socketPath: string = os.platform() === "win32"
		? path.join("\\\\?\\pipe", os.tmpdir(), `.code-server${Math.random().toString()}`)
		: path.join(os.tmpdir(), `.code-server${Math.random().toString()}`);
	private _state: SharedProcessState = SharedProcessState.Stopped;
	private activeProcess: ChildProcess | undefined;
	private ipcHandler: IpcHandler | undefined;
	private readonly onStateEmitter = new Emitter<SharedProcessEvent>();
	public readonly onState = this.onStateEmitter.event;
	private readonly logger = logger.named("shared");
	private readonly retry = retry.register("Shared process", () => this.connect());
	private disposed: boolean = false;

	public constructor(
		private readonly userDataDir: string,
		private readonly extensionsDir: string,
		private readonly builtInExtensionsDir: string,
		private readonly extraExtensionDirs: string[],
		private readonly extraBuiltinExtensionDirs: string[],
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

		const activeProcess = fork(path.join(__dirname, "shared-process"), [
				"--user-data-dir", this.userDataDir,
			], withEnv({ env: { VSCODE_ALLOW_IO: "true" } }),
		);
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

			this.ipcHandler = new IpcHandler(activeProcess);
			this.ipcHandler.once("handshake:hello", () => {
				const data: {
					sharedIPCHandle: string;
					args: SharedProcessArgs;
					logLevel: Level;
				} = {
					args: {
						"builtin-extensions-dir": this.builtInExtensionsDir,
						"user-data-dir": this.userDataDir,
						"extensions-dir": this.extensionsDir,
						"extra-extension-dirs": this.extraExtensionDirs,
						"extra-builtin-extension-dirs": this.extraBuiltinExtensionDirs,
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
