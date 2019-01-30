import * as events from "events";
import * as stream from "stream";
import { ReadWriteConnection } from "../common/connection";
import { NewConnectionMessage, ShutdownSessionMessage, ClientMessage, WriteToSessionMessage, ResizeSessionTTYMessage, TTYDimensions as ProtoTTYDimensions, ConnectionOutputMessage, ConnectionCloseMessage, ServerCloseMessage, NewServerMessage } from "../proto";

export interface TTYDimensions {
	readonly columns: number;
	readonly rows: number;
}

export interface SpawnOptions {
	cwd?: string;
	env?: { [key: string]: string };
	tty?: TTYDimensions;
}

export interface ForkOptions {
	cwd?: string;
	env?: { [key: string]: string };
}

export interface ChildProcess {
	readonly stdin: stream.Writable;
	readonly stdout: stream.Readable;
	readonly stderr: stream.Readable;

	readonly killed?: boolean;
	readonly pid: number | undefined;
	readonly title?: string;

	kill(signal?: string): void;

	send(message: string | Uint8Array, callback?: () => void, ipc?: false): void;
	send(message: any, callback: undefined | (() => void), ipc: true): void;

	on(event: "message", listener: (data: any) => void): void;
	on(event: "error", listener: (err: Error) => void): void;
	on(event: "exit", listener: (code: number, signal: string) => void): void;

	resize?(dimensions: TTYDimensions): void;
}

export class ServerProcess extends events.EventEmitter implements ChildProcess {
	public readonly stdin = new stream.Writable();
	public readonly stdout = new stream.Readable({ read: (): boolean => true });
	public readonly stderr = new stream.Readable({ read: (): boolean => true });

	private _pid: number | undefined;
	private _title: string | undefined;
	private _killed: boolean = false;
	private _connected: boolean = false;

	public constructor(
		private readonly connection: ReadWriteConnection,
		private readonly id: number,
		private readonly hasTty: boolean = false,
		private readonly ipc: boolean = false,
	) {
		super();
		if (!this.hasTty) {
			delete this.resize;
		}
	}

	public get pid(): number | undefined {
		return this._pid;
	}

	public set pid(pid: number | undefined) {
		this._pid = pid;
		this._connected = true;
	}

	public get title(): string | undefined {
		return this._title;
	}

	public set title(title: string | undefined) {
		this._title = title;
	}

	public get connected(): boolean {
		return this._connected;
	}

	public get killed(): boolean {
		return this._killed;
	}

	public kill(signal?: string): void {
		const kill = new ShutdownSessionMessage();
		kill.setId(this.id);
		if (signal) {
			kill.setSignal(signal);
		}
		const client = new ClientMessage();
		client.setShutdownSession(kill);
		this.connection.send(client.serializeBinary());

		this._killed = true;
		this._connected = false;
	}

	public send(message: string | Uint8Array | any, callback?: (error: Error | null) => void, ipc: boolean = this.ipc): boolean {
		const send = new WriteToSessionMessage();
		send.setId(this.id);
		send.setSource(ipc ? WriteToSessionMessage.Source.IPC : WriteToSessionMessage.Source.STDIN);
		if (ipc) {
			send.setData(new TextEncoder().encode(JSON.stringify(message)));
		} else {
			send.setData(typeof message === "string" ? new TextEncoder().encode(message) : message);
		}
		const client = new ClientMessage();
		client.setWriteToSession(send);
		this.connection.send(client.serializeBinary());
		// TODO: properly implement?
		if (callback) {
			callback(null);
		}

		return true;
	}

	public resize(dimensions: TTYDimensions): void {
		const resize = new ResizeSessionTTYMessage();
		resize.setId(this.id);
		const tty = new ProtoTTYDimensions();
		tty.setHeight(dimensions.rows);
		tty.setWidth(dimensions.columns);
		resize.setTtyDimensions(tty);
		const client = new ClientMessage();
		client.setResizeSessionTty(resize);
		this.connection.send(client.serializeBinary());
	}
}

export interface Socket {
	readonly destroyed: boolean;
	readonly connecting: boolean;
	write(buffer: Buffer): void;
	end(): void;

	connect(path: string, callback?: () => void): void;
	connect(port: number, callback?: () => void): void;

	addListener(event: "data", listener: (data: Buffer) => void): this;
	addListener(event: "close", listener: (hasError: boolean) => void): this;
	addListener(event: "connect", listener: () => void): this;
	addListener(event: "end", listener: () => void): this;

	on(event: "data", listener: (data: Buffer) => void): this;
	on(event: "close", listener: (hasError: boolean) => void): this;
	on(event: "connect", listener: () => void): this;
	on(event: "end", listener: () => void): this;

	once(event: "data", listener: (data: Buffer) => void): this;
	once(event: "close", listener: (hasError: boolean) => void): this;
	once(event: "connect", listener: () => void): this;
	once(event: "end", listener: () => void): this;

	removeListener(event: "data", listener: (data: Buffer) => void): this;
	removeListener(event: "close", listener: (hasError: boolean) => void): this;
	removeListener(event: "connect", listener: () => void): this;
	removeListener(event: "end", listener: () => void): this;

	emit(event: "data", data: Buffer): boolean;
	emit(event: "close"): boolean;
	emit(event: "connect"): boolean;
	emit(event: "end"): boolean;
}

export class ServerSocket extends events.EventEmitter implements Socket {

	public writable: boolean = true;
	public readable: boolean = true;

	private _destroyed: boolean = false;
	private _connecting: boolean = false;

	public constructor(
		private readonly connection: ReadWriteConnection,
		private readonly id: number,
		private readonly beforeConnect: (id: number, socket: ServerSocket) => void,
	) {
		super();
	}

	public connect(target: string | number, callback?: Function): void {
		this._connecting = true;
		this.beforeConnect(this.id, this);

		this.once("connect", () => {
			this._connecting = false;
			if (callback) {
				callback();
			}
		});

		const newCon = new NewConnectionMessage();
		newCon.setId(this.id);
		if (typeof target === "string") {
			newCon.setPath(target);
		} else {
			newCon.setPort(target);
		}
		const clientMsg = new ClientMessage();
		clientMsg.setNewConnection(newCon);
		this.connection.send(clientMsg.serializeBinary());
	}

	public get destroyed(): boolean {
		return this._destroyed;
	}

	public get connecting(): boolean {
		return this._connecting;
	}

	public write(buffer: Buffer): void {
		const sendData = new ConnectionOutputMessage();
		sendData.setId(this.id);
		sendData.setData(buffer);
		const client = new ClientMessage();
		client.setConnectionOutput(sendData);
		this.connection.send(client.serializeBinary());
	}

	public end(): void {
		const closeMsg = new ConnectionCloseMessage();
		closeMsg.setId(this.id);
		const client = new ClientMessage();
		client.setConnectionClose(closeMsg);
		this.connection.send(client.serializeBinary());
	}

	public addListener(event: "data", listener: (data: Buffer) => void): this;
	public addListener(event: "close", listener: (hasError: boolean) => void): this;
	public addListener(event: "connect", listener: () => void): this;
	public addListener(event: "end", listener: () => void): this;
	public addListener(event: string, listener: any): this {
		return super.addListener(event, listener);
	}

	public removeListener(event: "data", listener: (data: Buffer) => void): this;
	public removeListener(event: "close", listener: (hasError: boolean) => void): this;
	public removeListener(event: "connect", listener: () => void): this;
	public removeListener(event: "end", listener: () => void): this;
	public removeListener(event: string, listener: any): this {
		return super.removeListener(event, listener);
	}

	public on(event: "data", listener: (data: Buffer) => void): this;
	public on(event: "close", listener: (hasError: boolean) => void): this;
	public on(event: "connect", listener: () => void): this;
	public on(event: "end", listener: () => void): this;
	public on(event: string, listener: any): this {
		return super.on(event, listener);
	}

	public once(event: "data", listener: (data: Buffer) => void): this;
	public once(event: "close", listener: (hasError: boolean) => void): this;
	public once(event: "connect", listener: () => void): this;
	public once(event: "end", listener: () => void): this;
	public once(event: string, listener: any): this {
		return super.once(event, listener);
	}

	public emit(event: "data", data: Buffer): boolean;
	public emit(event: "close"): boolean;
	public emit(event: "connect"): boolean;
	public emit(event: "end"): boolean;
	public emit(event: string, ...args: any[]): boolean {
		return super.emit(event, ...args);
	}

	public setDefaultEncoding(encoding: string): this {
		throw new Error("Method not implemented.");
	}

}

export interface Server {
	addListener(event: "close", listener: () => void): this;
	addListener(event: "connect", listener: (socket: Socket) => void): this;
	addListener(event: "error", listener: (err: Error) => void): this;

	on(event: "close", listener: () => void): this;
	on(event: "connection", listener: (socket: Socket) => void): this;
	on(event: "error", listener: (err: Error) => void): this;

	once(event: "close", listener: () => void): this;
	once(event: "connection", listener: (socket: Socket) => void): this;
	once(event: "error", listener: (err: Error) => void): this;

	removeListener(event: "close", listener: () => void): this;
	removeListener(event: "connection", listener: (socket: Socket) => void): this;
	removeListener(event: "error", listener: (err: Error) => void): this;

	emit(event: "close"): boolean;
	emit(event: "connection"): boolean;
	emit(event: "error"): boolean;

	listen(path: string, listeningListener?: () => void): this;
	close(callback?: () => void): this;

	readonly listening: boolean;
}

export class ServerListener extends events.EventEmitter implements Server {

	private _listening: boolean = false;

	public constructor(
		private readonly connection: ReadWriteConnection,
		private readonly id: number,
		connectCallback?: () => void,
	) {
		super();

		this.on("connect", () => {
			this._listening = true;
			if (connectCallback) {
				connectCallback();
			}
		});
	}

	public get listening(): boolean {
		return this._listening;
	}

	public listen(path: string, listener?: () => void): this {
		const ns = new NewServerMessage();
		ns.setId(this.id);
		ns.setPath(path!);
		const cm = new ClientMessage();
		cm.setNewServer(ns);
		this.connection.send(cm.serializeBinary());

		if (typeof listener !== "undefined") {
			this.once("connect", listener);
		}

		return this;
	}

	public close(callback?: Function | undefined): this {
		const closeMsg = new ServerCloseMessage();
		closeMsg.setId(this.id);
		closeMsg.setReason("Manually closed");
		const clientMsg = new ClientMessage();
		clientMsg.setServerClose(closeMsg);
		this.connection.send(clientMsg.serializeBinary());

		if (callback) {
			callback();
		}

		return this;
	}

}
