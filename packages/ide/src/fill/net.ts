import * as net from "net";
import { CallbackEmitter, ActiveEvalDuplex, ActiveEvalHelper } from "@coder/protocol";
import { client } from "./client";

declare var __non_webpack_require__: typeof require;

class Socket extends ActiveEvalDuplex implements net.Socket {
	private _connecting: boolean = false;
	private _destroyed: boolean = false;

	public constructor(options?: net.SocketConstructorOpts, ae?: ActiveEvalHelper) {
		super(ae || client.run((ae, options) => {
			const net = __non_webpack_require__("net") as typeof import("net");

			return ae.bindSocket(new net.Socket(options));
		}, options));

		this.ae.on("connect", () => {
			this._connecting = false;
			this.emit("connect");
		});
		this.ae.on("error", () => {
			this._connecting = false;
			this._destroyed = true;
		});
		this.ae.on("lookup", (error, address, family, host) => this.emit("lookup", error, address, family, host));
		this.ae.on("timeout", () => this.emit("timeout"));
	}

	public connect(options: net.SocketConnectOpts | number | string, host?: string | Function, connectionListener?: Function): this {
		// This is to get around type issues with socket.connect as well as extract
		// the function wherever it might be.
		switch (typeof options) {
			case "string": options = { path: options }; break;
			case "number": options = { port: options }; break;
		}
		switch (typeof host) {
			case "function": connectionListener = host; break;
			case "string": (options as net.TcpSocketConnectOpts).host = host; break;
		}

		this._connecting = true;
		this.ae.emit("connect", options, this.storeCallback(connectionListener));

		return this;
	}

	// tslint:disable-next-line no-any
	public write(data: any, encoding?: string | Function, fd?: string | Function): boolean {
		let callback: Function | undefined;
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = undefined;
		}
		if (typeof fd === "function") {
			callback = fd;
			fd = undefined;
		}
		this.ae.emit("write", data, encoding, fd, this.storeCallback(callback));

		return true; // Always true since we can't get this synchronously.
	}

	public get connecting(): boolean { return this._connecting; }
	public get destroyed(): boolean { return this._destroyed; }

	public get bufferSize(): number { throw new Error("not implemented"); }
	public get bytesRead(): number { throw new Error("not implemented"); }
	public get bytesWritten(): number { throw new Error("not implemented"); }
	public get localAddress(): string { throw new Error("not implemented"); }
	public get localPort(): number { throw new Error("not implemented"); }
	public address(): net.AddressInfo | string { throw new Error("not implemented"); }

	public setTimeout(timeout: number, callback?: Function): this { return this.emitReturnThis("setTimeout", timeout, this.storeCallback(callback)); }
	public setNoDelay(noDelay?: boolean): this { return this.emitReturnThis("setNoDelay", noDelay); }
	public setKeepAlive(enable?: boolean, initialDelay?: number): this { return this.emitReturnThis("setKeepAlive", enable, initialDelay); }
	public unref(): void { this.ae.emit("unref"); }
	public ref(): void { this.ae.emit("ref"); }
}

class Server extends CallbackEmitter implements net.Server {
	private readonly sockets = new Map<number, Socket>();
	private _listening: boolean = false;

	public constructor(options?: { allowHalfOpen?: boolean, pauseOnConnect?: boolean } | ((socket: Socket) => void), connectionListener?: (socket: Socket) => void) {
		super();

		if (typeof options === "function") {
			connectionListener = options;
			options = undefined;
		}

		this.ae = client.run((ae, options, callbackId) => {
			const net = __non_webpack_require__("net") as typeof import("net");

			let connectionId = 0;
			const sockets = new Map<number, net.Socket>();
			const storeSocket = (socket: net.Socket): number => {
				const socketId = connectionId++;
				sockets.set(socketId, socket);
				const socketAe = ae.createUnique(socketId);
				const disposer = socketAe.bindSocket(socket);
				socket.on("close", () => {
					disposer.dispose();
					sockets.delete(socketId);
				});

				return socketId;
			};

			const callback = ae.maybeCallback(callbackId);
			let server = new net.Server(options, typeof callback !== "undefined" ? (socket): void => {
				callback(storeSocket(socket));
			} : undefined);

			server.on("close", () => ae.emit("close"));
			server.on("connection", (socket) => ae.emit("connection", storeSocket(socket)));
			server.on("error", (error) => ae.emit("error", error));
			server.on("listening", () => ae.emit("listening"));

			ae.on("close", (callbackId: number) => server.close(ae.maybeCallback(callbackId)));
			ae.on("listen", (handle?: net.ListenOptions | number | string) => server.listen(handle));
			ae.on("ref", () => server.ref());
			ae.on("unref", () => server.unref());

			return {
				onDidDispose: (cb): net.Server => server.on("close", cb),
				dispose: (): void => {
					server.removeAllListeners();
					server.close();
					sockets.forEach((socket) => {
						socket.removeAllListeners();
						socket.end();
						socket.destroy();
						socket.unref();
					});
					sockets.clear();
				},
			};
		}, options || {}, this.storeCallback(connectionListener));

		this.ae.on("close", () => {
			this._listening = false;
			this.emit("close");
		});

		this.ae.on("connection", (socketId) => {
			const socketAe = this.ae.createUnique(socketId);
			const socket = new Socket(undefined, socketAe);
			this.sockets.set(socketId, socket);
			socket.on("close", () => this.sockets.delete(socketId));
			if (connectionListener) {
				connectionListener(socket);
			}
			this.emit("connection", socket);
		});

		this.ae.on("error", (error) => {
			this._listening = false;
			this.emit("error", error);
		});

		this.ae.on("listening", () => {
			this._listening = true;
			this.emit("listening");
		});
	}

	public listen(handle?: net.ListenOptions | number | string, hostname?: string | number | Function, backlog?: number | Function, listeningListener?: Function): this {
		if (typeof handle === "undefined") {
			throw new Error("no handle");
		}

		switch (typeof handle) {
			case "number": handle = { port: handle }; break;
			case "string": handle = { path: handle }; break;
		}
		switch (typeof hostname) {
			case "function": listeningListener = hostname; break;
			case "string": handle.host = hostname; break;
			case "number": handle.backlog = hostname; break;
		}
		switch (typeof backlog) {
			case "function": listeningListener = backlog; break;
			case "number": handle.backlog = backlog; break;
		}

		if (listeningListener) {
			this.ae.on("listening", () => {
				listeningListener!();
			});
		}

		this.ae.emit("listen", handle);

		return this;
	}

	public close(callback?: Function): this {
		// close() doesn't fire the close event until all connections are also
		// closed, but it does prevent new connections.
		this._listening = false;
		this.ae.emit("close", this.storeCallback(callback));

		return this;
	}

	public get connections(): number { return this.sockets.size; }
	public get listening(): boolean { return this._listening; }

	public get maxConnections(): number { throw new Error("not implemented"); }
	public address(): net.AddressInfo | string { throw new Error("not implemented"); }

	public ref(): this { return this.emitReturnThis("ref"); }
	public unref(): this { return this.emitReturnThis("unref"); }
	public getConnections(cb: (error: Error | null, count: number) => void): void { cb(null, this.sockets.size); }

	// tslint:disable-next-line no-any
	private emitReturnThis(event: string, ...args: any[]): this {
		this.ae.emit(event, ...args);

		return this;
	}
}

type NodeNet = typeof net;

/**
 * Implementation of net for the browser.
 */
class Net implements NodeNet {
	// @ts-ignore this is because Socket is missing things from the Stream
	// namespace but I'm unsure how best to provide them (finished,
	// finished.__promisify__, pipeline, and some others) or if it even matters.
	public readonly Socket = Socket;
	public readonly Server = Server;

	public createConnection(target: string | number | net.NetConnectOpts, host?: string | Function, callback?: Function): net.Socket {
		const socket = new Socket();
		socket.connect(target, host, callback);

		return socket;
	}

	public createServer(
		options?: { allowHalfOpen?: boolean, pauseOnConnect?: boolean } | ((socket: net.Socket) => void),
		connectionListener?: (socket: net.Socket) => void,
	): net.Server {
		return new Server(options, connectionListener);
	}

	public connect(): net.Socket { throw new Error("not implemented"); }
	public isIP(_input: string): number { throw new Error("not implemented"); }
	public isIPv4(_input: string): boolean { throw new Error("not implemented"); }
	public isIPv6(_input: string): boolean { throw new Error("not implemented"); }
}

export = new Net();
