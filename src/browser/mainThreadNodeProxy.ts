import { IDisposable } from "vs/base/common/lifecycle";
import { INodeProxyService } from "vs/server/src/common/nodeProxy";
import { ExtHostContext, IExtHostContext, MainContext, MainThreadNodeProxyShape } from "vs/workbench/api/common/extHost.protocol";
import { extHostNamedCustomer } from "vs/workbench/api/common/extHostCustomers";

@extHostNamedCustomer(MainContext.MainThreadNodeProxy)
export class MainThreadNodeProxy implements MainThreadNodeProxyShape {
	private disposed = false;
	private disposables = <IDisposable[]>[];

	constructor(
		extHostContext: IExtHostContext,
		@INodeProxyService private readonly proxyService: INodeProxyService,
	) {
		if (!extHostContext.remoteAuthority) { // HACK: A terrible way to detect if running in the worker.
			const proxy = extHostContext.getProxy(ExtHostContext.ExtHostNodeProxy);
			this.disposables = [
				this.proxyService.onMessage((message: string) => proxy.$onMessage(message)),
				this.proxyService.onClose(() => proxy.$onClose()),
				this.proxyService.onDown(() => proxy.$onDown()),
				this.proxyService.onUp(() => proxy.$onUp()),
			];
		}
	}

	$send(message: string): void {
		if (!this.disposed) {
			this.proxyService.send(message);
		}
	}

	dispose(): void {
		this.disposables.forEach((d) => d.dispose());
		this.disposables = [];
		this.disposed = true;
	}
}
