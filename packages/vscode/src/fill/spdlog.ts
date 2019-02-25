import { RotatingLogger as NodeRotatingLogger } from "spdlog";
import { logger } from "@coder/logger";
import { client } from "@coder/ide/src/fill/client";

const ae = client.run((ae) => {
	const loggers = new Map<number, NodeRotatingLogger>();

	ae.on("new", (id: number, name: string, filePath: string, fileSize: number, fileCount: number) => {
		const logger = new ae.modules.spdlog.RotatingLogger(name, filePath, fileSize, fileCount);
		loggers.set(id, logger);
	});

	ae.on("clearFormatters", (id: number) => loggers.get(id)!.clearFormatters());
	ae.on("critical", (id: number, message: string) => loggers.get(id)!.critical(message));
	ae.on("debug", (id: number, message: string) => loggers.get(id)!.debug(message));
	ae.on("drop", (id: number) => loggers.get(id)!.drop());
	ae.on("errorLog", (id: number, message: string) => loggers.get(id)!.error(message));
	ae.on("flush", (id: number) => loggers.get(id)!.flush());
	ae.on("info", (id: number, message: string) => loggers.get(id)!.info(message));
	ae.on("setAsyncMode", (bufferSize: number, flushInterval: number) => ae.modules.spdlog.setAsyncMode(bufferSize, flushInterval));
	ae.on("setLevel", (id: number, level: number) => loggers.get(id)!.setLevel(level));
	ae.on("trace", (id: number, message: string) => loggers.get(id)!.trace(message));
	ae.on("warn", (id: number, message: string) => loggers.get(id)!.warn(message));

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
ae.on("error", (error: Error) => spdLogger.error(error.message));

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
