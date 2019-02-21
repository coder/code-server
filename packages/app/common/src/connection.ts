import { Event } from "@coder/events";
import { TunnelCloseEvent } from "@coder/tunnel/src/client";

export interface TcpHost {
	listen(host: string, port: number): Promise<TcpServer>;
}

export interface TcpServer {
	readonly onConnection: Event<TcpConnection>;
	close(): Promise<void>;
}

export interface TcpConnection {
	readonly onData: Event<ArrayBuffer>;
	send(data: ArrayBuffer): Promise<void>;
	close(): Promise<void>;
}
