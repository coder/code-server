import { Emitter } from "@coder/events";
import { field, logger } from "@coder/logger";
import { Client, ReadWriteConnection } from "@coder/protocol";
import { retry } from "../retry";

/**
 * A connection based on a web socket. Automatically reconnects and buffers
 * messages during connection.
 */
class WebsocketConnection implements ReadWriteConnection {
	private activeSocket: WebSocket | undefined;
	private readonly messageBuffer = <Uint8Array[]>[];
	private readonly socketTimeoutDelay = 60 * 1000;
	private readonly retry = retry.register("Socket", () => this.connect());
	private isUp: boolean = false;
	private closed: boolean = false;

	private readonly messageEmitter = new Emitter<Uint8Array>();
	private readonly closeEmitter = new Emitter<void>();
	private readonly upEmitter = new Emitter<void>();
	private readonly downEmitter = new Emitter<void>();

	public readonly onUp = this.upEmitter.event;
	public readonly onClose = this.closeEmitter.event;
	public readonly onDown = this.downEmitter.event;
	public readonly onMessage = this.messageEmitter.event;

	public constructor() {
		this.retry.block();
		this.retry.run();
	}

	/**
	 * Send data across the socket. If closed, will error. If connecting, will
	 * queue.
	 */
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

	/**
	 * Close socket connection.
	 */
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
				try {
					this.downEmitter.emit(undefined);
				} catch (error) {
					// Don't let errors here prevent restarting.
					logger.error(error.message);
				}
			}
			logger.warn(
				"Web socket closed",
				field("code", event.code),
				field("reason", event.reason),
				field("wasClean", event.wasClean),
			);
			if (!this.closed) {
				this.retry.block();
				this.retry.run();
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
		const wsProto = location.protocol === "https:" ? "wss" : "ws";
		const socket = new WebSocket(
			`${wsProto}://${location.host}${location.pathname}`,
		);
		socket.binaryType = "arraybuffer";
		this.activeSocket = socket;

		const socketWaitTimeout = window.setTimeout(() => {
			socket.close();
		}, this.socketTimeoutDelay);

		await new Promise((resolve, reject): void => {
			const doReject = (): void => {
				clearTimeout(socketWaitTimeout);
				socket.removeEventListener("error", doReject);
				socket.removeEventListener("close", doReject);
				reject();
			};
			socket.addEventListener("error", doReject);
			socket.addEventListener("close", doReject);

			socket.addEventListener("open", () => {
				clearTimeout(socketWaitTimeout);
				socket.removeEventListener("error", doReject);
				socket.removeEventListener("close", doReject);
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
export const client = new Client(new WebsocketConnection());
