import { ChildProcess } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { forkModule } from "./bootstrapFork";
import { StdioIpcHandler } from "../ipc";
import { logger, field } from "@coder/logger/src";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { LogLevel } from "vs/platform/log/common/log";
import { Emitter, Event } from '@coder/events/src';

export class SharedProcess {
	public readonly socketPath: string = path.join(os.tmpdir(), `.vscode-online${Math.random().toString()}`);
	private _ready: Promise<void> | undefined;
	private activeProcess: ChildProcess | undefined;
	private ipcHandler: StdioIpcHandler | undefined;
	private readonly willRestartEmitter: Emitter<void>;

	public constructor(
		private readonly userDataDir: string,
	) {
		this.willRestartEmitter = new Emitter();

		this.restart();
	}

	public get onWillRestart(): Event<void> {
		return this.willRestartEmitter.event;
	}

	public get ready(): Promise<void> {
		return this._ready!;
	}

	public restart(): void {
		if (this.activeProcess) {
			this.willRestartEmitter.emit();
		}

		if (this.activeProcess && !this.activeProcess.killed) {
			this.activeProcess.kill();
		}

		let resolve: () => void;
		let reject: (err: Error) => void;

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

		this._ready = new Promise<void>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		let resolved: boolean = false;
		this.activeProcess = forkModule("vs/code/electron-browser/sharedProcess/sharedProcessMain");
		this.activeProcess.on("exit", () => {
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
			resolve();
		});
		this.activeProcess.stderr.on("data", (data) => {
			if (!resolved) {
				reject(data.toString());
			} else {
				logger.named("SHRD PROC").debug("stderr", field("message", data.toString()));
			}
		});
	}

	public dispose(): void {
		if (this.ipcHandler) {
			this.ipcHandler.send("handshake:goodbye");
		}
		this.ipcHandler = undefined;
	}
}
