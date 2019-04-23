import * as net from "net";
import { ServerProxy } from "../../common/proxy";
import { DuplexProxy } from "./stream";

// tslint:disable completed-docs no-any

export class NetSocketProxy extends DuplexProxy<net.Socket> {
	public constructor(socket: net.Socket) {
		super(socket, ["connect", "lookup", "timeout"]);
	}

	public async connect(options: number | string | net.SocketConnectOpts, host?: string): Promise<void> {
		this.instance.connect(options as any, host as any);
	}

	public async unref(): Promise<void> {
		this.instance.unref();
	}

	public async ref(): Promise<void> {
		this.instance.ref();
	}

	public async dispose(): Promise<void> {
		this.instance.end();
		this.instance.destroy();
		this.instance.unref();
		await super.dispose();
	}
}

export class NetServerProxy extends ServerProxy<net.Server> {
	public constructor(instance: net.Server) {
		super({
			bindEvents: ["close", "error", "listening"],
			doneEvents: ["close"],
			instance,
		});
	}

	public async listen(handle?: net.ListenOptions | number | string, hostname?: string | number, backlog?: number): Promise<void> {
		this.instance.listen(handle, hostname as any, backlog as any);
	}

	public async ref(): Promise<void> {
		this.instance.ref();
	}

	public async unref(): Promise<void> {
		this.instance.unref();
	}

	public async close(): Promise<void> {
		this.instance.close();
	}

	public async onConnection(cb: (proxy: NetSocketProxy) => void): Promise<void> {
		this.instance.on("connection", (socket) => cb(new NetSocketProxy(socket)));
	}

	public async dispose(): Promise<void> {
		this.instance.close();
		this.instance.removeAllListeners();
	}
}

export class NetModuleProxy {
	public async createSocket(options?: net.SocketConstructorOpts): Promise<NetSocketProxy> {
		return new NetSocketProxy(new net.Socket(options));
	}

	public async createConnection(target: string | number | net.NetConnectOpts, host?: string): Promise<NetSocketProxy> {
		return new NetSocketProxy(net.createConnection(target as any, host));
	}

	public async createServer(options?: { allowHalfOpen?: boolean, pauseOnConnect?: boolean }): Promise<NetServerProxy> {
		return new NetServerProxy(net.createServer(options));
	}
}
