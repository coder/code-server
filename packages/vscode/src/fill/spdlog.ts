/// <reference path="../../../../lib/vscode/src/typings/spdlog.d.ts" />
import { RotatingLogger as NodeRotatingLogger } from "spdlog";
import { logger } from "@coder/logger";
import { client } from "@coder/ide/src/fill/client";

declare var __non_webpack_require__: typeof require;

const ae = client.run((ae) => {
	const spdlog = __non_webpack_require__("spdlog") as typeof import("spdlog");
	const loggers = new Map<number, NodeRotatingLogger>();

	ae.on("new", (id, name, filePath, fileSize, fileCount) => {
		const logger = new spdlog.RotatingLogger(name, filePath, fileSize, fileCount);
		loggers.set(id, logger);
	});

	ae.on("clearFormatters", (id) => loggers.get(id)!.clearFormatters());
	ae.on("critical", (id, message) => loggers.get(id)!.critical(message));
	ae.on("debug", (id, message) => loggers.get(id)!.debug(message));
	ae.on("drop", (id) => loggers.get(id)!.drop());
	ae.on("errorLog", (id, message) => loggers.get(id)!.error(message));
	ae.on("flush", (id) => loggers.get(id)!.flush());
	ae.on("info", (id, message) => loggers.get(id)!.info(message));
	ae.on("setAsyncMode", (bufferSize, flushInterval) => spdlog.setAsyncMode(bufferSize, flushInterval));
	ae.on("setLevel", (id, level) => loggers.get(id)!.setLevel(level));
	ae.on("trace", (id, message) => loggers.get(id)!.trace(message));
	ae.on("warn", (id, message) => loggers.get(id)!.warn(message));

	const disposeCallbacks = <Array<() => void>>[];

	return {
		onDidDispose: (cb): number => disposeCallbacks.push(cb),
		dispose: (): void => {
			loggers.forEach((logger) => logger.flush());
			loggers.clear();
			disposeCallbacks.forEach((cb) => cb());
		},
	};
});

const spdLogger = logger.named("spdlog");
ae.on("close", () => spdLogger.error("session closed prematurely"));
ae.on("error", (error) => spdLogger.error(error.message));

let id = 0;
export class RotatingLogger implements NodeRotatingLogger {
	private readonly id = id++;

	public constructor(name: string, filePath: string, fileSize: number, fileCount: number) {
		ae.emit("new", this.id, name, filePath, fileSize, fileCount);
	}

	public trace(message: string): void { ae.emit("trace", this.id, message); }
	public debug(message: string): void { ae.emit("debug", this.id, message); }
	public info(message: string): void { ae.emit("info", this.id, message); }
	public warn(message: string): void { ae.emit("warn", this.id, message); }
	public error(message: string): void { ae.emit("errorLog", this.id, message); }
	public critical(message: string): void { ae.emit("critical", this.id, message); }
	public setLevel(level: number): void { ae.emit("setLevel", this.id, level); }
	public clearFormatters(): void { ae.emit("clearFormatters", this.id); }
	public flush(): void { ae.emit("flush", this.id); }
	public drop(): void { ae.emit("drop", this.id); }
}

export const setAsyncMode = (bufferSize: number, flushInterval: number): void => {
	ae.emit("setAsyncMode", bufferSize, flushInterval);
};
