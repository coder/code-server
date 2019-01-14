import * as events from "events";
import * as stream from "stream";
import { SendableConnection } from "../common/connection";
import { ShutdownSessionMessage, ClientMessage, SessionOutputMessage, WriteToSessionMessage, ResizeSessionTTYMessage, TTYDimensions as ProtoTTYDimensions } from "../proto";

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
	public readonly stdout = new stream.Readable({ read: () => true });
	public readonly stderr = new stream.Readable({ read: () => true });
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

	public resize(dimensions: TTYDimensions) {
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
