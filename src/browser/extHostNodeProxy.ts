import { Emitter } from "vs/base/common/event";
import { createDecorator } from "vs/platform/instantiation/common/instantiation";
import { ExtHostNodeProxyShape, MainContext, MainThreadNodeProxyShape } from "vs/workbench/api/common/extHost.protocol";
import { IExtHostRpcService } from "vs/workbench/api/common/extHostRpcService";

export class ExtHostNodeProxy implements ExtHostNodeProxyShape {
	_serviceBrand: any;

	private readonly _onMessage = new Emitter<string>();
	public readonly onMessage = this._onMessage.event;
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;
	private readonly _onDown = new Emitter<void>();
	public readonly onDown = this._onDown.event;
	private readonly _onUp = new Emitter<void>();
	public readonly onUp = this._onUp.event;

	private readonly proxy: MainThreadNodeProxyShape;

	constructor(@IExtHostRpcService rpc: IExtHostRpcService) {
		this.proxy = rpc.getProxy(MainContext.MainThreadNodeProxy);
	}

	public $onMessage(message: string): void {
		this._onMessage.fire(message);
	}

	public $onClose(): void {
		this._onClose.fire();
	}

	public $onUp(): void {
		this._onUp.fire();
	}

	public $onDown(): void {
		this._onDown.fire();
	}

	public send(message: string): void {
		this.proxy.$send(message);
	}
}

export interface IExtHostNodeProxy extends ExtHostNodeProxy { }
export const IExtHostNodeProxy = createDecorator<IExtHostNodeProxy>("IExtHostNodeProxy");
