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

// tslint:disable only-arrow-functions
function connect(): net.Socket {
	throw new Error("not implemented");
}

function createConnection(): net.Socket {
	throw new Error("not implemented");
}

function isIP(_input: string): number {
	throw new Error("not implemented");
}

function isIPv4(_input: string): boolean {
	throw new Error("not implemented");
}

function isIPv6(_input: string): boolean {
	throw new Error("not implemented");
}

function createServer(
	_options?: { allowHalfOpen?: boolean, pauseOnConnect?: boolean } | ((socket: net.Socket) => void),
	_connectionListener?: (socket: net.Socket) => void,
): Server {
	return new Server();
}
// tslint:enable only-arrow-functions

const exp: typeof net = {
	Socket,
	Server,
	connect,
	createConnection,
	isIP,
	isIPv4,
	isIPv6,
	createServer,
};

export = exp;
