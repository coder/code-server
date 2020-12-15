import { Client } from '@coder/node-browser';
import { fromTar } from '@coder/requirefs';
import { URI } from 'vs/base/common/uri';
import { ILogService } from 'vs/platform/log/common/log';
import { ExtensionActivationTimesBuilder } from 'vs/workbench/api/common/extHostExtensionActivator';
import { IExtHostNodeProxy } from './extHostNodeProxy';

export const loadCommonJSModule = async <T>(
	module: URI,
	activationTimesBuilder: ExtensionActivationTimesBuilder,
	nodeProxy: IExtHostNodeProxy,
	logService: ILogService,
	vscode: any,
): Promise<T> => {
	const client = new Client(nodeProxy, { logger: logService });
	const [buffer, init] = await Promise.all([
		nodeProxy.fetchExtension(module),
		client.handshake(),
	]);
	const rfs = fromTar(buffer);
	(<any>self).global = self;
	rfs.provide('vscode', vscode);
	Object.keys(client.modules).forEach((key) => {
		const mod = (client.modules as any)[key];
		if (key === 'process') {
			(<any>self).process = mod;
			(<any>self).process.env = init.env;
			return;
		}

		rfs.provide(key, mod);
		switch (key) {
			case 'buffer':
				(<any>self).Buffer = mod.Buffer;
				break;
			case 'timers':
				(<any>self).setImmediate = mod.setImmediate;
				break;
		}
	});

	try {
		activationTimesBuilder.codeLoadingStart();
		return rfs.require('.');
	} finally {
		activationTimesBuilder.codeLoadingStop();
	}
};
