import { VSBuffer } from 'vs/base/common/buffer';
import { IDisposable } from 'vs/base/common/lifecycle';
import { FileAccess } from 'vs/base/common/network';
import { URI, UriComponents } from 'vs/base/common/uri';
import { INodeProxyService } from 'vs/server/common/nodeProxy';
import { ExtHostContext, IExtHostContext, MainContext, MainThreadNodeProxyShape } from 'vs/workbench/api/common/extHost.protocol';
import { extHostNamedCustomer } from 'vs/workbench/api/common/extHostCustomers';

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

	async $fetchExtension(extensionUri: UriComponents): Promise<VSBuffer> {
		const fetchUri = URI.from({
			scheme: window.location.protocol.replace(':', ''),
			authority: window.location.host,
			// Use FileAccess to get the static base path.
			path: FileAccess.asBrowserUri('', require).path,
			query: `tar=${encodeURIComponent(extensionUri.path)}`,
		});
		const response = await fetch(fetchUri.toString(true));
		if (response.status !== 200) {
			throw new Error(`Failed to download extension "${module}"`);
		}
		return VSBuffer.wrap(new Uint8Array(await response.arrayBuffer()));
	}

	dispose(): void {
		this.disposables.forEach((d) => d.dispose());
		this.disposables = [];
		this.disposed = true;
	}
}
