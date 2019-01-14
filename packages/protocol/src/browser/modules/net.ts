import * as net from "net";

type NodeNet = typeof net;

/**
 * Implementation of net for the browser.
 */
export class Net implements NodeNet {

	public get Socket(): typeof net.Socket {
		throw new Error("not implemented");
	}

	public get Server(): typeof net.Server {
		throw new Error("not implemented");
	}

	public connect(): net.Socket {
		throw new Error("not implemented");
	}

	public createConnection(): net.Socket {
		throw new Error("not implemented");
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
		throw new Error("not implemented");
	}

}
