import * as pty from "node-pty";
import { ClientProxy, Module } from "../../common/proxy";
import { NodePtyModuleProxy, NodePtyProcessProxy } from "../../node/modules/node-pty";

// tslint:disable completed-docs

interface ClientNodePtyProcessProxy extends NodePtyProcessProxy {
	proxyId: number | Module;
}

export class NodePtyProcess extends ClientProxy<ClientNodePtyProcessProxy> implements pty.IPty {
	private _pid = -1;
	private _process = "";

	public constructor(
		private readonly moduleProxy: ClientNodePtyModuleProxy,
		private readonly file: string,
		private readonly args: string[] | string,
		private readonly options: pty.IPtyForkOptions,
	) {
		super(moduleProxy.spawn(file, args, options));
		this.on("process", (process) => this._process = process);
	}

	protected initialize(proxyPromise: Promise<ClientNodePtyProcessProxy>): ClientNodePtyProcessProxy {
		const proxy = super.initialize(proxyPromise);
		this.catch(this.proxy.getPid().then((p) => this._pid = p));
		this.catch(this.proxy.getProcess().then((p) => this._process = p));

		return proxy;
	}

	public get pid(): number {
		return this._pid;
	}

	public get process(): string {
		return this._process;
	}

	public resize(columns: number, rows: number): void {
		this.catch(this.proxy.resize(columns, rows));
	}

	public write(data: string): void {
		this.catch(this.proxy.write(data));
	}

	public kill(signal?: string): void {
		this.catch(this.proxy.kill(signal));
	}

	protected handleDisconnect(): void {
		this._process += " (disconnected)";
		this.emit("data", "\r\n\nLost connection...\r\n\n");
		this.initialize(this.moduleProxy.spawn(this.file, this.args, this.options));
	}
}

type NodePty = typeof pty;

interface ClientNodePtyModuleProxy extends NodePtyModuleProxy {
	proxyId: number | Module;
	spawn(file: string, args: string[] | string, options: pty.IPtyForkOptions): Promise<ClientNodePtyProcessProxy>;
}

export class NodePtyModule implements NodePty {
	public constructor(private readonly proxy: ClientNodePtyModuleProxy) {}

	public spawn = (file: string, args: string[] | string, options: pty.IPtyForkOptions): pty.IPty => {
		return new NodePtyProcess(this.proxy, file, args, options);
	}
}
