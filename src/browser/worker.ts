import { URI } from "vs/base/common/uri";
import { IExtensionDescription } from "vs/platform/extensions/common/extensions";
import { ILogService } from "vs/platform/log/common/log";
import { Client } from "vs/server/node_modules/@coder/node-browser/out/client/client";
import { fromTar } from "vs/server/node_modules/@coder/requirefs/out/requirefs";
import { ExtensionActivationTimesBuilder } from "vs/workbench/api/common/extHostExtensionActivator";
import { IExtHostNodeProxy } from "./extHostNodeProxy";

export const loadCommonJSModule = async <T>(
	module: IExtensionDescription,
	activationTimesBuilder: ExtensionActivationTimesBuilder,
	nodeProxy: IExtHostNodeProxy,
	logService: ILogService,
	vscode: any,
): Promise<T> => {
	const fetchUri = URI.from({
		scheme: self.location.protocol.replace(":", ""),
		authority: self.location.host,
		path: `${self.location.pathname.replace(/\/static.*\/out\/vs\/workbench\/services\/extensions\/worker\/extensionHostWorkerMain.js$/, "")}/tar`,
		query: `path=${encodeURIComponent(module.extensionLocation.path)}`,
	});
	const response = await fetch(fetchUri.toString(true));
	if (response.status !== 200) {
		throw new Error(`Failed to download extension "${module.extensionLocation.path}"`);
	}
	const client = new Client(nodeProxy, { logger: logService });
	const init = await client.handshake();
	const buffer = new Uint8Array(await response.arrayBuffer());
	const rfs = fromTar(buffer);
	(<any>self).global = self;
	rfs.provide("vscode", vscode);
	Object.keys(client.modules).forEach((key) => {
		const mod = (client.modules as any)[key];
		if (key === "process") {
			(<any>self).process = mod;
			(<any>self).process.env = init.env;
			return;
		}

		rfs.provide(key, mod);
		switch (key) {
			case "buffer":
				(<any>self).Buffer = mod.Buffer;
				break;
			case "timers":
				(<any>self).setImmediate = mod.setImmediate;
				break;
		}
	});

	try {
		activationTimesBuilder.codeLoadingStart();
		return rfs.require(".");
	} finally {
		activationTimesBuilder.codeLoadingStop();
	}
};
