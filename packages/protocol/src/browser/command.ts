import * as events from "events";
import * as stream from "stream";
import { SendableConnection } from "../common/connection";
import { ShutdownSessionMessage, ClientMessage, WriteToSessionMessage, ResizeSessionTTYMessage, TTYDimensions as ProtoTTYDimensions, ConnectionOutputMessage, ConnectionCloseMessage } from "../proto";

export interface TTYDimensions {
	readonly columns: number;
	readonly rows: number;
}

export interface SpawnOptions {
	cwd?: string;
	env?: { readonly [key: string]: string };
	tty?: TTYDimensions;
}

export interface ChildProcess {
	readonly stdin: stream.Writable;
	readonly stdout: stream.Readable;
	readonly stderr: stream.Readable;

	readonly killed?: boolean;
	readonly pid: number | undefined;

	kill(signal?: string): void;
	send(message: string | Uint8Array): void;

	on(event: "error", listener: (err: Error) => void): void;
	on(event: "exit", listener: (code: number, signal: string) => void): void;

	resize?(dimensions: TTYDimensions): void;
}

export class ServerProcess extends events.EventEmitter implements ChildProcess {
	public readonly stdin = new stream.Writable();
	public readonly stdout = new stream.Readable({ read: (): boolean => true });
	public readonly stderr = new stream.Readable({ read: (): boolean => true });
	public pid: number | undefined;

	private _killed: boolean = false;

	public constructor(
		private readonly connection: SendableConnection,
		private readonly id: number,
		private readonly hasTty: boolean = false,
	) {
		super();

		if (!this.hasTty) {
			delete this.resize;
		}
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
	}

	public send(message: string | Uint8Array): void {
		const send = new WriteToSessionMessage();
		send.setId(this.id);
		send.setData(typeof message === "string" ? new TextEncoder().encode(message) : message);
		const client = new ClientMessage();
		client.setWriteToSession(send);
		this.connection.send(client.serializeBinary());
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
	private _connecting: boolean = true;

	public constructor(
		private readonly connection: SendableConnection,
		private readonly id: number,
		connectCallback?: () => void,
	) {
		super();

		if (connectCallback) {
			this.once("connect", () => {
				this._connecting = false;
				connectCallback();
			});
		}
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
