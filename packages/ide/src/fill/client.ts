import { Emitter } from "@coder/events";
import { field, logger } from "@coder/logger";
import { Client, ReadWriteConnection } from "@coder/protocol";
import { retry } from "../retry";

/**
 * A connection based on a web socket. Automatically reconnects and buffers
 * messages during connection.
 */
class Connection implements ReadWriteConnection {
	private activeSocket: WebSocket | undefined;
	private readonly messageEmitter: Emitter<Uint8Array> = new Emitter();
	private readonly closeEmitter: Emitter<void> = new Emitter();
	private readonly upEmitter: Emitter<void> = new Emitter();
	private readonly downEmitter: Emitter<void> = new Emitter();
	private readonly messageBuffer: Uint8Array[] = [];
	private socketTimeoutDelay = 60 * 1000;
	private retryName = "Socket";
	private isUp: boolean = false;
	private closed: boolean = false;

	public constructor() {
		retry.register(this.retryName, () => this.connect());
		retry.block(this.retryName);
		retry.run(this.retryName);
	}

	/**
	 * Register a function to be called when the connection goes up.
	 */
	public onUp(cb: () => void): void {
		this.upEmitter.event(cb);
	}

	/**
	 * Register a function to be called when the connection goes down.
	 */
	public onDown(cb: () => void): void {
		this.downEmitter.event(cb);
	}

	public send(data: Buffer | Uint8Array): void {
		if (this.closed) {
			throw new Error("web socket is closed");
		}
		if (!this.activeSocket || this.activeSocket.readyState !== this.activeSocket.OPEN) {
			this.messageBuffer.push(data);
		} else {
			this.activeSocket.send(data);
		}
	}

	public onMessage(cb: (data: Uint8Array | Buffer) => void): void {
		this.messageEmitter.event(cb);
	}

	public onClose(cb: () => void): void {
		this.closeEmitter.event(cb);
	}

	public close(): void {
		this.closed = true;
		this.dispose();
		this.closeEmitter.emit();
	}

	/**
	 * Connect to the server.
	 */
	private async connect(): Promise<void> {
		const socket = await this.openSocket();

		socket.addEventListener("message", (event: MessageEvent) => {
			this.messageEmitter.emit(event.data);
		});

		socket.addEventListener("close", (event) => {
			if (this.isUp) {
				this.isUp = false;
				this.downEmitter.emit(undefined);
			}
			logger.warn(
				"Web socket closed",
				field("code", event.code),
				field("reason", event.reason),
				field("wasClean", event.wasClean),
			);
			if (!this.closed) {
				retry.block(this.retryName);
				retry.run(this.retryName);
			}
		});

		// Send any messages that were queued while we were waiting to connect.
		while (this.messageBuffer.length > 0) {
			socket.send(this.messageBuffer.shift()!);
		}

		if (!this.isUp) {
			this.isUp = true;
			this.upEmitter.emit(undefined);
		}
	}

	/**
	 * Open a web socket, disposing the previous connection if any.
	 */
	private async openSocket(): Promise<WebSocket> {
		this.dispose();
		const socket = new WebSocket(
			`${location.protocol === "https" ? "wss" : "ws"}://${location.host}`,
		);
		socket.binaryType = "arraybuffer";
		this.activeSocket = socket;

		const socketWaitTimeout = window.setTimeout(() => {
			socket.close();
		}, this.socketTimeoutDelay);

		await new Promise((resolve, reject): void => {
			const onClose = (): void => {
				clearTimeout(socketWaitTimeout);
				socket.removeEventListener("close", onClose);
				reject();
			};
			socket.addEventListener("close", onClose);

			socket.addEventListener("open", async () => {
				clearTimeout(socketWaitTimeout);
				resolve();
			});
		});

		return socket;
	}

	/**
	 * Dispose the current connection.
	 */
	private dispose(): void {
		if (this.activeSocket) {
			this.activeSocket.close();
		}
	}
}

// Global instance so all fills can use the same client.
export const client = new Client(new Connection());
