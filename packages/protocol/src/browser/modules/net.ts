import * as net from "net";
import { Client } from "../client";

type NodeNet = typeof net;

/**
 * Implementation of net for the browser.
 */
export class Net implements NodeNet {

	public constructor(
		private readonly client: Client,
	) {}

	public get Socket(): typeof net.Socket {
		throw new Error("not implemented");
	}

	public get Server(): typeof net.Server {
		throw new Error("not implemented");
	}

	public connect(): net.Socket {
		throw new Error("not implemented");
	}

	// tslint:disable-next-line no-any
	public createConnection(...args: any[]): net.Socket {
		//@ts-ignore
		return this.client.createConnection(...args) as net.Socket;
	}

	public isIP(_input: string): number {
		throw new Error("not implemented");
	}

	public isIPv4(_input: string): boolean {
		throw new Error("not implemented");
	}

	public isIPv6(_input: string): boolean {
		throw new Error("not implemented");
	}

	public createServer(
		_options?: { allowHalfOpen?: boolean, pauseOnConnect?: boolean } | ((socket: net.Socket) => void),
		_connectionListener?: (socket: net.Socket) => void,
	): net.Server {
		return this.client.createServer() as net.Server;
	}

}
