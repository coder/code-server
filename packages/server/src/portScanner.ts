//@ts-ignore
import * as netstat from "node-netstat";
import { Event, Emitter } from "@coder/events";
import { logger } from "@coder/logger";

export interface PortScanner {
	readonly ports: ReadonlyArray<number>;

	readonly onAdded: Event<ReadonlyArray<number>>;
	readonly onRemoved: Event<ReadonlyArray<number>>;

	dispose(): void;
}

/**
 * Creates a disposable port scanner.
 * Will scan local ports and emit events when ports are added or removed.
 * Currently only scans TCP ports.
 */
export const createPortScanner = (scanInterval: number = 5000): PortScanner => {
	const ports = new Map<number, number>();

	const addEmitter = new Emitter<number[]>();
	const removeEmitter = new Emitter<number[]>();

	const scan = (onCompleted: (err?: Error) => void): void => {
		const scanTime = Date.now();
		const added: number[] = [];
		netstat({
			done: (err: Error): void => {
				const removed: number[] = [];
				ports.forEach((value, key) => {
					if (value !== scanTime) {
						// Remove port
						removed.push(key);
						ports.delete(key);
					}
				});
				if (removed.length > 0) {
					removeEmitter.emit(removed);
				}

				if (added.length > 0) {
					addEmitter.emit(added);
				}

				onCompleted(err);
			},
			filter: {
				state: "LISTEN",
			},
		}, (data: {
			readonly protocol: string;
			readonly local: {
				readonly port: number;
				readonly address: string;
			};
		}) => {
				// https://en.wikipedia.org/wiki/Registered_port
				if (data.local.port <= 1023 || data.local.port >= 49151) {
					return;
				}
				// Only forward TCP ports
				if (!data.protocol.startsWith("tcp")) {
					return;
				}

				if (!ports.has(data.local.port)) {
					added.push(data.local.port);
				}
				ports.set(data.local.port, scanTime);
			});
	};

	let lastTimeout: NodeJS.Timer | undefined;
	let disposed: boolean = false;

	const doInterval = (): void => {
		logger.trace("scanning ports");
		scan((error) => {
			if (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					logger.warn("Port scanning will not be available because netstat is not installed");
				} else {
					logger.warn(`Port scanning will not be available: ${error.message}`);
				}
				disposed = true;
			} else if (!disposed) {
				lastTimeout = setTimeout(doInterval, scanInterval);
			}
		});
	};

	doInterval();

	return {
		get ports(): number[] {
			return Array.from(ports.keys());
		},
		get onAdded(): Event<number[]> {
			return addEmitter.event;
		},
		get onRemoved(): Event<number[]> {
			return removeEmitter.event;
		},
		dispose(): void {
			if (typeof lastTimeout !== "undefined") {
				clearTimeout(lastTimeout);
			}
			disposed = true;
		},
	};
};
