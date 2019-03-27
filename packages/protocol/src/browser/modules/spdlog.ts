import * as spdlog from "spdlog";
import { ClientProxy } from "../../common/proxy";
import { RotatingLoggerProxy, SpdlogModuleProxy } from "../../node/modules/spdlog";

class RotatingLogger extends ClientProxy<RotatingLoggerProxy> implements spdlog.RotatingLogger {
	public async trace (message: string): Promise<void> { this.proxy.trace(message); }
	public async debug (message: string): Promise<void> { this.proxy.debug(message); }
	public async info (message: string): Promise<void> { this.proxy.info(message); }
	public async warn (message: string): Promise<void> { this.proxy.warn(message); }
	public async error (message: string): Promise<void> { this.proxy.error(message); }
	public async critical (message: string): Promise<void> { this.proxy.critical(message); }
	public async setLevel (level: number): Promise<void> { this.proxy.setLevel(level); }
	public async clearFormatters (): Promise<void> { this.proxy.clearFormatters(); }
	public async flush (): Promise<void> { this.proxy.flush(); }
	public async drop (): Promise<void> { this.proxy.drop(); }

	protected handleDisconnect(): void {
		// TODO: reconnect.
	}
}

export class SpdlogModule {
	public readonly RotatingLogger: typeof spdlog.RotatingLogger;

	public constructor(private readonly proxy: SpdlogModuleProxy) {
		this.RotatingLogger = class extends RotatingLogger {
			public constructor(name: string, filename: string, filesize: number, filecount: number) {
				super(proxy.createLogger(name, filename, filesize, filecount));
			}
		};
	}

	public setAsyncMode = (bufferSize: number, flushInterval: number): void => {
		this.proxy.setAsyncMode(bufferSize, flushInterval);
	}
}
