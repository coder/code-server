import * as net from "net";
import { ServerProxy } from "../../common/proxy";
import { DuplexProxy } from "./stream";

// tslint:disable completed-docs

export class NetSocketProxy extends DuplexProxy<net.Socket> {
	public async connect(options: number | string | net.SocketConnectOpts, host?: string): Promise<void> {
		this.stream.connect(options as any, host as any); // tslint:disable-line no-any this works fine
	}

	public async unref(): Promise<void> {
		this.stream.unref();
	}

	public async ref(): Promise<void> {
		this.stream.ref();
	}

	public async dispose(): Promise<void> {
		this.stream.removeAllListeners();
		this.stream.end();
		this.stream.destroy();
		this.stream.unref();
	}

	public async onDone(cb: () => void): Promise<void> {
		this.stream.on("close", cb);
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		await super.onEvent(cb);
		this.stream.on("connect", () => cb("connect"));
		this.stream.on("lookup", (error, address, family, host) => cb("lookup", error, address, family, host));
		this.stream.on("timeout", () => cb("timeout"));
	}
}

export class NetServerProxy implements ServerProxy {
	public constructor(private readonly server: net.Server) {}

	public async listen(handle?: net.ListenOptions | number | string, hostname?: string | number, backlog?: number): Promise<void> {
		this.server.listen(handle, hostname as any, backlog as any); // tslint:disable-line no-any this is fine
	}

	public async ref(): Promise<void> {
		this.server.ref();
	}

	public async unref(): Promise<void> {
		this.server.unref();
	}

	public async close(): Promise<void> {
		this.server.close();
	}

	public async onConnection(cb: (proxy: NetSocketProxy) => void): Promise<void> {
		this.server.on("connection", (socket) => cb(new NetSocketProxy(socket)));
	}

	public async dispose(): Promise<void> {
		this.server.close();
		this.server.removeAllListeners();
	}

	public async onDone(cb: () => void): Promise<void> {
		this.server.on("close", cb);
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		this.server.on("close", () => cb("close"));
		this.server.on("error", (error) => cb("error", error));
		this.server.on("listening", () => cb("listening"));
	}
}

export class NetModuleProxy {
	public async createSocket(options?: net.SocketConstructorOpts): Promise<NetSocketProxy> {
		return new NetSocketProxy(new net.Socket(options));
	}

	public async createConnection(target: string | number | net.NetConnectOpts, host?: string): Promise<NetSocketProxy> {
		return new NetSocketProxy(net.createConnection(target as any, host)); // tslint:disable-line no-any defeat stubborness
	}

	public async createServer(options?: { allowHalfOpen?: boolean, pauseOnConnect?: boolean }): Promise<NetServerProxy> {
		return new NetServerProxy(net.createServer(options));
	}
}
