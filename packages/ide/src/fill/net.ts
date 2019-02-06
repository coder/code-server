import * as net from "net";
import { Client } from "@coder/protocol";
import { client } from "./client";

type NodeNet = typeof net;

/**
 * Implementation of net for the browser.
 */
class Net implements NodeNet {
	public constructor(
		private readonly client: Client,
	) {}

	public get Socket(): typeof net.Socket {
		return this.client.Socket;
	}

	public get Server(): typeof net.Server {
		throw new Error("not implemented");
	}

	public connect(): net.Socket {
		throw new Error("not implemented");
	}

	public createConnection(target: string | number | net.NetConnectOpts, host?: string | Function, callback?: Function): net.Socket {
		if (typeof target === "object") {
			throw new Error("not implemented");
		}

		return this.client.createConnection(target, typeof host === "function" ? host : callback) as net.Socket;
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

export = new Net(client);
