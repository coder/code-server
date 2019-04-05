import * as spdlog from "spdlog";
import { ClientProxy } from "../../common/proxy";
import { RotatingLoggerProxy, SpdlogModuleProxy } from "../../node/modules/spdlog";

// tslint:disable completed-docs

class RotatingLogger extends ClientProxy<RotatingLoggerProxy> implements spdlog.RotatingLogger {
	public constructor(
		private readonly moduleProxy: SpdlogModuleProxy,
		private readonly name: string,
		private readonly filename: string,
		private readonly filesize: number,
		private readonly filecount: number,
	) {
		super(moduleProxy.createLogger(name, filename, filesize, filecount));
	}

	public trace (message: string): void { this.catch(this.proxy.trace(message)); }
	public debug (message: string): void { this.catch(this.proxy.debug(message)); }
	public info (message: string): void { this.catch(this.proxy.info(message)); }
	public warn (message: string): void { this.catch(this.proxy.warn(message)); }
	public error (message: string): void { this.catch(this.proxy.error(message)); }
	public critical (message: string): void { this.catch(this.proxy.critical(message)); }
	public setLevel (level: number): void { this.catch(this.proxy.setLevel(level)); }
	public clearFormatters (): void { this.catch(this.proxy.clearFormatters()); }
	public flush (): void { this.catch(this.proxy.flush()); }
	public drop (): void { this.catch(this.proxy.drop()); }

	protected handleDisconnect(): void {
		this.initialize(this.moduleProxy.createLogger(this.name, this.filename, this.filesize, this.filecount));
	}
}

export class SpdlogModule {
	public readonly RotatingLogger: typeof spdlog.RotatingLogger;

	public constructor(private readonly proxy: SpdlogModuleProxy) {
		this.RotatingLogger = class extends RotatingLogger {
			public constructor(name: string, filename: string, filesize: number, filecount: number) {
				super(proxy, name, filename, filesize, filecount);
			}
		};
	}

	public setAsyncMode = (bufferSize: number, flushInterval: number): Promise<void> => {
		return this.proxy.setAsyncMode(bufferSize, flushInterval);
	}

	public createRotatingLogger(name: string, filename: string, filesize: number, filecount: number): RotatingLogger {
		return new RotatingLogger(this.proxy, name, filename, filesize, filecount);
	}

	public createRotatingLoggerAsync(name: string, filename: string, filesize: number, filecount: number): Promise<RotatingLogger> {
		return Promise.resolve(this.createRotatingLogger(name, filename, filesize, filecount));
	}
}
