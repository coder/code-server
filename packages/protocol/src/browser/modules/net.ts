import * as net from "net";

/**
 * Implementation of Socket for the browser.
 */
class Socket extends net.Socket {

	public connect(): this {
		throw new Error("not implemented");
	}

}

/**
 * Implementation of Server for the browser.
 */
class Server extends net.Server {

	public listen(
		_port?: number | any | net.ListenOptions, // tslint:disable-line no-any so we can match the Node API.
		_hostname?: string | number | Function,
		_backlog?: number | Function,
		_listeningListener?: Function,
	): this {
		throw new Error("not implemented");
	}

}

type NodeNet = typeof net;

/**
 * Implementation of net for the browser.
 */
export class Net implements NodeNet {

	public get Socket(): typeof net.Socket {
		return Socket;
	}

	public get Server(): typeof net.Server {
		return Server;
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
	): Server {
		return new Server();
	}

}
