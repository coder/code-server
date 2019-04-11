/// <reference path="../../../../../lib/vscode/src/typings/spdlog.d.ts" />
import { EventEmitter } from "events";
import * as spdlog from "spdlog";
import { ServerProxy } from "../../common/proxy";

// tslint:disable completed-docs

export class RotatingLoggerProxy implements ServerProxy {
	private readonly emitter = new EventEmitter();

	public constructor(private readonly logger: spdlog.RotatingLogger) {}

	public async trace (message: string): Promise<void> { this.logger.trace(message); }
	public async debug (message: string): Promise<void> { this.logger.debug(message); }
	public async info (message: string): Promise<void> { this.logger.info(message); }
	public async warn (message: string): Promise<void> { this.logger.warn(message); }
	public async error (message: string): Promise<void> { this.logger.error(message); }
	public async critical (message: string): Promise<void> { this.logger.critical(message); }
	public async setLevel (level: number): Promise<void> { this.logger.setLevel(level); }
	public async clearFormatters (): Promise<void> { this.logger.clearFormatters(); }
	public async flush (): Promise<void> { this.logger.flush(); }
	public async drop (): Promise<void> { this.logger.drop(); }

	public async onDone(cb: () => void): Promise<void> {
		this.emitter.on("dispose", cb);
	}

	public async dispose(): Promise<void> {
		await this.flush();
		this.emitter.emit("dispose");
		this.emitter.removeAllListeners();
	}

	// tslint:disable-next-line no-any
	public async onEvent(_cb: (event: string, ...args: any[]) => void): Promise<void> {
		// No events.
	}
}

export class SpdlogModuleProxy {
	public async createLogger(name: string, filePath: string, fileSize: number, fileCount: number): Promise<RotatingLoggerProxy> {
		return new RotatingLoggerProxy(new (require("spdlog") as typeof import("spdlog")).RotatingLogger(name, filePath, fileSize, fileCount));
	}

	public async setAsyncMode(bufferSize: number, flushInterval: number): Promise<void> {
		require("spdlog").setAsyncMode(bufferSize, flushInterval);
	}
}
