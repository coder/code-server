import * as pty from "node-pty";
import { ClientProxy } from "../../common/proxy";
import { NodePtyModuleProxy, NodePtyProcessProxy } from "../../node/modules/node-pty";

export class NodePtyProcess extends ClientProxy<NodePtyProcessProxy> implements pty.IPty {
	private _pid = -1;
	private _process = "";

	public constructor(proxyPromise: Promise<NodePtyProcessProxy>) {
		super(proxyPromise);
		this.proxy.getPid().then((pid) => this._pid = pid);
		this.proxy.getProcess().then((process) => this._process = process);
		this.on("process", (process) => this._process = process);
	}

	public get pid(): number {
		return this._pid;
	}

	public get process(): string {
		return this._process;
	}

	public resize(columns: number, rows: number): void {
		this.proxy.resize(columns, rows);
	}

	public write(data: string): void {
		this.proxy.write(data);
	}

	public kill(signal?: string): void {
		this.proxy.kill(signal);
	}

	protected handleDisconnect(): void {
		this._process += " (disconnected)";
		this.emit("data", "\r\n\nLost connection...");
	}
}

type NodePty = typeof pty;

export class NodePtyModule implements NodePty {
	public constructor(private readonly proxy: NodePtyModuleProxy) {}

	public spawn = (file: string, args: string[] | string, options: pty.IPtyForkOptions): pty.IPty => {
		return new NodePtyProcess(this.proxy.spawn(file, args, options));
	}
}
